import logging
import os
from typing import Any, List, Optional, TypedDict

import instructor
from groq import AsyncGroq
from langgraph.graph import END, START, StateGraph
from pydantic import BaseModel, Field

from app.domain.models.rag import Citation, CitedComplianceVerdict, ComplianceItem, Risk
from app.infrastructure.rag.reranker import extract_citations, format_context, rerank
from app.infrastructure.rag.retriever import regulatory_retriever

logger = logging.getLogger(__name__)

class ComplianceState(TypedDict):
    product_name: str
    hs_code: Optional[str]
    direction: str
    supplementary_context: Optional[str]

    # Internal state passed between nodes
    query_terms: List[str]
    chunks: List[Any]  # RetrievedChunk
    ranked_chunks: List[Any]
    citations: List[Citation]
    context_str: str
    retrieval_used: bool

    # Final output
    verdict: Optional[CitedComplianceVerdict]
    error: Optional[str]


# Pydantic schemas for structured extraction
class ComplianceItemDef(BaseModel):
    code: str
    name: str
    agency: str
    agency_short: str
    description: str
    how_to_obtain: str
    processing_time: str
    cost_estimate: str
    is_critical: bool
    agency_url: Optional[str] = None

class RiskItem(BaseModel):
    level: str = Field(description="high/medium/low")
    reason: str
    action_required: str

class ExportVerdictResponse(BaseModel):
    product_name: str
    status: str
    suggested_hs_code: Optional[str]
    afcfta_eligible: bool
    tariff_saving_percent: Optional[float]
    roo_eligible: bool
    roo_type: Optional[str]
    summary: str
    what_to_do: str
    risks: List[RiskItem]
    compliance_items: List[ComplianceItemDef]

class ImportVerdictResponse(BaseModel):
    product_name: str
    status: str
    suggested_hs_code: Optional[str]
    prohibited: bool
    prohibition_reason: Optional[str]
    import_duty_percent: Optional[float]
    vat_percent: float = Field(default=7.5)
    summary: str
    what_to_do: str
    risks: List[RiskItem]
    compliance_items: List[ComplianceItemDef]


class ComplianceChain:
    def __init__(self):
        self.client = instructor.from_groq(
            AsyncGroq(api_key=os.environ.get("GROQ_API_KEY")), mode=instructor.Mode.JSON
        )
        model_name = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")
        if model_name == "llama-3.3-70b-versatile":
            model_name = "qwen/qwen3.8-27b"
        self.model = model_name
        self.temperature = float(os.environ.get("COMPLIANCE_TEMPERATURE", "0.2"))

        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        workflow = StateGraph(ComplianceState)

        workflow.add_node("retrieve", self._node_retrieve)
        workflow.add_node("rerank", self._node_rerank)
        workflow.add_node("generate", self._node_generate)

        workflow.add_edge(START, "retrieve")
        workflow.add_edge("retrieve", "rerank")
        workflow.add_edge("rerank", "generate")
        workflow.add_edge("generate", END)

        return workflow.compile()

    async def _node_retrieve(self, state: ComplianceState) -> dict:
        product_name = state["product_name"]
        direction = state["direction"]

        chunks = []
        try:
            chunks = await regulatory_retriever.retrieve_for_compliance(product_name, direction)
        except Exception as e:
            logger.error("Retrieval failed: %s", e)

        if not chunks:
            logger.info(f"No local chunks found for {product_name}. Initiating Agentic Web Search fallback...")
            try:
                from duckduckgo_search import DDGS

                from app.domain.models.rag import RetrievedChunk

                query = f"Nigeria {direction} customs tariff requirements guidelines {product_name}"

                # Use DDGS synchronously in a thread pool, or since it's lightweight just run it
                # DDGS now supports async, but we can just use the standard text search
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=3))

                web_chunks = []
                for i, r in enumerate(results):
                    web_chunks.append(RetrievedChunk(
                        source="Agentic Web Search",
                        agency="External Web Source",
                        chunk_index=i,
                        content=f"Title: {r.get('title', '')}\nSnippet: {r.get('body', '')}",
                        similarity=0.9,
                        url=r.get("href", "")
                    ))
                chunks = web_chunks
            except Exception as web_e:
                logger.error("Web search fallback failed: %s", web_e)

        return {"chunks": chunks}

    async def _node_rerank(self, state: ComplianceState) -> dict:
        product_name = state["product_name"]
        direction = state["direction"]
        chunks = state.get("chunks", [])

        query_terms = product_name.lower().split() + [direction, "nigeria", "compliance"]
        ranked_chunks = rerank(chunks, query_terms)

        context_str = format_context(ranked_chunks)
        raw_citations = extract_citations(ranked_chunks)
        citations = [Citation(**c) for c in raw_citations]
        retrieval_used = len(ranked_chunks) > 0

        return {
            "query_terms": query_terms,
            "ranked_chunks": ranked_chunks,
            "context_str": context_str,
            "citations": citations,
            "retrieval_used": retrieval_used
        }

    async def _node_generate(self, state: ComplianceState) -> dict:
        direction = state["direction"]
        context = state.get("context_str", "")
        supplementary_context = state.get("supplementary_context")
        retrieval_used = state.get("retrieval_used", False)

        direction_label = "EXPORT from Nigeria to an African country" if direction == "export" else "IMPORT into Nigeria"
        system_prompt = (
            f"You are a senior Nigerian trade compliance expert specializing in Nigerian {direction_label} regulations. "
            "You have been provided with retrieved excerpts from official regulatory documents below. "
            "Your compliance verdict MUST be grounded in these documents. "
        )

        if not retrieval_used:
            system_prompt += (
                " No regulatory documents were retrieved from the vector store. "
                "State this limitation in the summary, reduce confidence, and avoid inventing "
                "specific legal citations."
            )

        extra_block = ""
        if supplementary_context:
            extra_block = f"\n\nSTRUCTURED TRADE DATA:\n{supplementary_context}\n"

        user_prompt = f"""RETRIEVED REGULATORY DOCUMENTS:
{context}
{extra_block}
---

TASK: Analyze the following trade query for Nigerian {direction_label} compliance.

Product: {state['product_name']}
HS Code: {state['hs_code'] or "Unknown — suggest the correct one"}
Direction: {direction_label}

Using the retrieved documents above as your primary evidence, produce a compliance verdict.
Reference the specific source documents in your summary and what_to_do fields where applicable.
"""

        response_model = ExportVerdictResponse if direction == "export" else ImportVerdictResponse

        try:
            completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                model=self.model,
                response_model=response_model,
                temperature=self.temperature,
            )

            raw = completion.model_dump()

            risks = [Risk(**r) for r in raw.get("risks", [])]
            compliance_items = [ComplianceItem(**c) for c in raw.get("compliance_items", [])]

            verdict = CitedComplianceVerdict(
                product_name=raw.get("product_name") or state["product_name"],
                status=raw.get("status", "under_review"),
                suggested_hs_code=raw.get("suggested_hs_code") or state["hs_code"],
                summary=raw.get("summary", ""),
                what_to_do=raw.get("what_to_do", ""),
                risks=risks,
                compliance_items=compliance_items,
                citations=state.get("citations", []),
                direction=direction,
                afcfta_eligible=raw.get("afcfta_eligible"),
                tariff_saving_percent=raw.get("tariff_saving_percent"),
                roo_eligible=raw.get("roo_eligible"),
                roo_type=raw.get("roo_type"),
                prohibited=raw.get("prohibited"),
                prohibition_reason=raw.get("prohibition_reason"),
                import_duty_percent=raw.get("import_duty_percent"),
                vat_percent=raw.get("vat_percent", 7.5),
                retrieval_used=retrieval_used,
            )

            return {"verdict": verdict}

        except Exception as e:
            logger.error("Groq LLM call failed in orchestrator: %s", e)
            return {"error": str(e)}

    async def run(
        self,
        product_name: str,
        hs_code: Optional[str] = None,
        direction: str = "import",
        supplementary_context: Optional[str] = None,
    ) -> CitedComplianceVerdict:

        initial_state = {
            "product_name": product_name,
            "hs_code": hs_code,
            "direction": direction,
            "supplementary_context": supplementary_context,
        }

        final_state = await self.graph.ainvoke(initial_state)

        if final_state.get("error") and not final_state.get("verdict"):
            raise ValueError(f"Orchestrator failed: {final_state['error']}")

        return final_state["verdict"]


compliance_chain = ComplianceChain()
