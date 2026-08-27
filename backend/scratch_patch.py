import os
import json
import logging
from datetime import datetime, timezone
import instructor
from groq import AsyncGroq
from tenacity import retry, wait_exponential, stop_after_attempt
from pydantic import BaseModel, Field
from typing import Optional, List

from app.infrastructure.ai.prompts import (
    COMPLIANCE_SYSTEM_PROMPT,
    COMPLIANCE_EXPORT_PROMPT_TEMPLATE,
    COMPLIANCE_IMPORT_PROMPT_TEMPLATE,
    FEW_SHOT_EXPORT_EXAMPLE,
    DOCUMENT_GENERATION_SYSTEM_PROMPT,
    DOCUMENT_GENERATION_PROMPT_TEMPLATE
)

logger = logging.getLogger(__name__)


class RiskItem(BaseModel):
    level: str = Field(description="high/medium/low")
    reason: str
    action_required: str


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


class ComplianceAnalysisResponse(BaseModel):
    product_name: str
    status: str
    suggested_hs_code: Optional[str] = None
    afcfta_eligible: Optional[bool] = None
    tariff_saving_percent: Optional[float] = None
    roo_eligible: Optional[bool] = None
    roo_type: Optional[str] = None
    prohibited: Optional[bool] = None
    prohibition_reason: Optional[str] = None
    import_duty_percent: Optional[float] = None
    vat_percent: Optional[float] = None
    summary: str
    what_to_do: str
    risks: List[RiskItem]
    compliance_items: List[ComplianceItemDef]


class DocumentSection(BaseModel):
    title: str
    content: str


class DocumentSupportItem(BaseModel):
    item: str
    description: str
    mandatory: bool


class DocumentGenerationResponse(BaseModel):
    document_title: str
    agency: str
    agency_address: str
    purpose: str
    sections: List[DocumentSection]
    cover_letter: str
    submission_steps: List[str]
    supporting_documents_checklist: List[DocumentSupportItem]
    important_notes: str
    estimated_processing: str
    estimated_cost: str


class IntelligenceService:
    def __init__(self):
        self.client = instructor.from_groq(
            AsyncGroq(api_key=os.environ.get("GROQ_API_KEY")), mode=instructor.Mode.JSON
        )
        self.model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.vision_model = os.environ.get("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
        self.temperature = float(os.environ.get("COMPLIANCE_TEMPERATURE", "0.2"))

    def _build_prompt(self, product_name: str, hs_code: str, direction: str, retrieved_context: Optional[str] = None) -> str:
        context_block = ""
        if retrieved_context:
            context_block = f"\nRELEVANT REGULATORY DOCUMENTS:\n{retrieved_context}\n\nGround your answer in the above documents where applicable.\n"

        template = COMPLIANCE_EXPORT_PROMPT_TEMPLATE if direction == "export" else COMPLIANCE_IMPORT_PROMPT_TEMPLATE
        
        return template.format(
            context_block=context_block,
            product_name=product_name,
            hs_code=hs_code or "Unknown"
        )

    async def analyze_compliance(
        self,
        product_name: str,
        hs_code: str = None,
        direction: str = "import",
        retrieved_context: Optional[str] = None,
        supplementary_context: Optional[str] = None,
    ) -> dict:
        from app.infrastructure.rag.compliance_chain import compliance_chain

        extra = supplementary_context or ""
        if retrieved_context:
            extra = f"{retrieved_context}\n{extra}".strip() if extra else retrieved_context

        try:
            verdict = await compliance_chain.run(
                product_name=product_name,
                hs_code=hs_code,
                direction=direction,
                supplementary_context=extra or None,
            )
            return verdict.model_dump()
        except Exception as e:
            logger.warning("RAG compliance chain failed for %s, falling back to LLM: %s", product_name, e)
            return await self._analyze_compliance_llm_only(
                product_name, hs_code, direction, retrieved_context, supplementary_context
            )

    @retry(wait=wait_exponential(min=1, max=10), stop=stop_after_attempt(3))
    async def _analyze_compliance_llm_only(
        self,
        product_name: str,
        hs_code: str = None,
        direction: str = "import",
        retrieved_context: Optional[str] = None,
        supplementary_context: Optional[str] = None,
    ) -> dict:
        context_parts = []
        if retrieved_context:
            context_parts.append(retrieved_context)
        if supplementary_context:
            context_parts.append(supplementary_context)
        combined_context = "\n".join(context_parts) if context_parts else None

        prompt = self._build_prompt(product_name, hs_code, direction, combined_context)
        
        messages = [
            {"role": "system", "content": COMPLIANCE_SYSTEM_PROMPT},
        ]
        
        if direction == "export":
            # Add few-shot example for export to improve consistency
            messages.append({"role": "user", "content": self._build_prompt("Cocoa Beans", "180100", "export", None)})
            messages.append({"role": "assistant", "content": json.dumps(FEW_SHOT_EXPORT_EXAMPLE)})

        messages.append({"role": "user", "content": prompt})

        chat_completion = await self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            response_model=ComplianceAnalysisResponse,
            temperature=self.temperature,
        )
        
        result = chat_completion.model_dump()
        result["direction"] = direction
        result["retrieval_used"] = False
        result["citations"] = []
        return result

    async def analyze_image(self, base64_image: str, direction: str = "import") -> dict:
        from app.infrastructure.ai.vision_pipeline import vision_pipeline
        from app.infrastructure.ai.hs_classifier import hs_classifier
        from app.domain.models.vision import VisualAnalysisResult

        try:
            logger.info("Processing image - length: %d", len(base64_image))

            attributes = await vision_pipeline.identify_product(base64_image)
            logger.info("Identified: %s (category: %s)", attributes.product_name, attributes.category)

            hs_result = await hs_classifier.classify(attributes)
            logger.info("HS Code: %s (confidence: %s)", hs_result.assigned_code, hs_result.confidence)

            compliance = await self.analyze_compliance(
                product_name=attributes.product_name,
                hs_code=hs_result.assigned_code,
                direction=direction,
            )

            visual_result = VisualAnalysisResult(
                product_name=attributes.product_name,
                attributes=attributes,
                hs_code=hs_result,
                direction=direction,
            )

            compliance["product_name"] = attributes.product_name
            compliance["direction"] = direction
            compliance["visual_analysis"] = visual_result.model_dump()

            return compliance

        except Exception as e:
            logger.exception("Vision analysis failed")
            raise Exception(f"Vision analysis failed: {str(e)}") from e

    @retry(wait=wait_exponential(min=1, max=10), stop=stop_after_attempt(3))
    async def generate_document(
        self,
        document_code: str,
        document_name: str,
        product_name: str,
        hs_code: str = None,
        direction: str = "import",
        destination_country: str = None,
        business_name: str = None,
        business_address: str = None,
        cac_number: str = None,
    ) -> dict:
        from app.infrastructure.rag.retriever import regulatory_retriever
        from app.infrastructure.rag.reranker import rerank, format_context

        reg_context = ""
        try:
            chunks = await regulatory_retriever.retrieve_for_compliance(
                f"{document_code} {document_name} {product_name}",
                direction,
            )
            ranked = rerank(
                chunks,
                [document_code, product_name, direction, "nigeria"],
            )
            reg_context = format_context(ranked, max_chars=4000)
        except Exception as e:
            logger.warning("Document RAG retrieval failed: %s", e)

        context_block = ""
        if reg_context and reg_context != "No regulatory documents retrieved.":
            context_block = f"""
    RELEVANT REGULATORY DOCUMENTS:
    {reg_context}

    Ground the document content in the above regulations where applicable.
    """
        
        prompt = DOCUMENT_GENERATION_PROMPT_TEMPLATE.format(
            context_block=context_block,
            document_name=document_name,
            document_code=document_code,
            product_name=product_name,
            hs_code=hs_code or "To be confirmed",
            direction=direction,
            business_name=business_name or "[BUSINESS NAME]",
            cac_number=cac_number or "[CAC NUMBER]",
            destination_country=destination_country or "N/A"
        )

        logger.info("Generating document: %s for %s", document_code, product_name)
        completion = await self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": DOCUMENT_GENERATION_SYSTEM_PROMPT,
                },
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            response_model=DocumentGenerationResponse,
            temperature=0.1,
        )

        return completion.model_dump()


intelligence_service = IntelligenceService()
