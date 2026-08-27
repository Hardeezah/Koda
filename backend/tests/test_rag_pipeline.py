from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domain.models.rag import RetrievedChunk


@pytest.fixture
def mock_chunks():
    return [
        RetrievedChunk(
            source="ncs_2026_prohibition_list",
            agency="Nigeria Customs Service",
            doc_date="2026-01",
            url="https://customs.gov.ng",
            chunk_index=0,
            content="Ginger imports require Form M declaration to the Central Bank of Nigeria.",
            similarity=0.82,
        ),
        RetrievedChunk(
            source="nafdac_import_guidelines",
            agency="NAFDAC",
            doc_date="2024-01",
            url="https://www.nafdac.gov.ng",
            chunk_index=1,
            content="NAFDAC registration is required for food products entering Nigeria.",
            similarity=0.71,
        ),
    ]


# --- RegulatoryRetriever tests ---

class TestRegulatoryRetriever:
    @pytest.mark.asyncio
    async def test_retrieve_returns_chunks(self):
        resp = MagicMock()
        resp.data = [
            {
                "source": "ncs_2026_prohibition_list",
                "agency": "Nigeria Customs Service",
                "doc_date": "2026-01",
                "url": "https://customs.gov.ng",
                "chunk_index": 0,
                "content": "Ginger imports require Form M.",
                "similarity": 0.82,
            }
        ]

        with patch(
            "app.infrastructure.rag.retriever.RegulatoryRetriever._embed_query",
            new=AsyncMock(return_value=[0.1] * 384),
        ), patch(
            "app.infrastructure.rag.retriever.get_supabase_admin"
        ) as mock_get_supabase:
            mock_supabase = MagicMock()
            mock_supabase.rpc.return_value.execute.return_value = resp
            mock_get_supabase.return_value = mock_supabase

            from app.infrastructure.rag.retriever import RegulatoryRetriever
            retriever = RegulatoryRetriever()
            chunks = await retriever.retrieve("ginger import compliance")

            assert len(chunks) == 1
            assert chunks[0].source == "ncs_2026_prohibition_list"
            assert chunks[0].similarity == 0.82

    @pytest.mark.asyncio
    async def test_retrieve_returns_empty_on_no_data(self):
        resp = MagicMock()
        resp.data = []

        with patch(
            "app.infrastructure.rag.retriever.RegulatoryRetriever._embed_query",
            new=AsyncMock(return_value=[0.1] * 384),
        ), patch(
            "app.infrastructure.rag.retriever.get_supabase_admin"
        ) as mock_get_supabase:
            mock_supabase = MagicMock()
            mock_supabase.rpc.return_value.execute.return_value = resp
            mock_get_supabase.return_value = mock_supabase

            from app.infrastructure.rag.retriever import RegulatoryRetriever
            retriever = RegulatoryRetriever()
            chunks = await retriever.retrieve("nonexistent product")

            assert chunks == []

    @pytest.mark.asyncio
    async def test_retrieve_retries_on_failure(self):
        call_count = 0

        async def failing_then_succeeding(query):
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ConnectionError("Supabase timeout")
            return [0.1] * 384

        resp = MagicMock()
        resp.data = []

        with patch(
            "app.infrastructure.rag.retriever.RegulatoryRetriever._embed_query",
            side_effect=failing_then_succeeding,
        ), patch(
            "app.infrastructure.rag.retriever.get_supabase_admin"
        ) as mock_get_supabase, patch(
            "app.infrastructure.rag.retriever.asyncio.sleep",
            new=AsyncMock(),
        ):
            mock_supabase = MagicMock()
            mock_supabase.rpc.return_value.execute.return_value = resp
            mock_get_supabase.return_value = mock_supabase

            from app.infrastructure.rag.retriever import RegulatoryRetriever
            retriever = RegulatoryRetriever()
            chunks = await retriever.retrieve("ginger")

            assert call_count == 2
            assert chunks == []

    @pytest.mark.asyncio
    async def test_retrieve_for_compliance_filters_by_similarity(self):
        resp = MagicMock()
        resp.data = [
            {
                "source": "a",
                "agency": "NCS",
                "doc_date": "2026-01",
                "url": "https://x.com",
                "chunk_index": 0,
                "content": "High similarity chunk",
                "similarity": 0.80,
            },
            {
                "source": "b",
                "agency": "NCS",
                "doc_date": "2026-01",
                "url": "https://x.com",
                "chunk_index": 1,
                "content": "Low similarity chunk",
                "similarity": 0.15,
            },
        ]

        with patch(
            "app.infrastructure.rag.retriever.RegulatoryRetriever._embed_query",
            new=AsyncMock(return_value=[0.1] * 384),
        ), patch(
            "app.infrastructure.rag.retriever.get_supabase_admin"
        ) as mock_get_supabase:
            mock_supabase = MagicMock()
            mock_supabase.rpc.return_value.execute.return_value = resp
            mock_get_supabase.return_value = mock_supabase

            from app.infrastructure.rag.retriever import RegulatoryRetriever
            retriever = RegulatoryRetriever()
            chunks = await retriever.retrieve_for_compliance("ginger", "import")

            assert len(chunks) == 1
            assert chunks[0].content == "High similarity chunk"


# --- ComplianceChain tests ---

class TestComplianceChainFailurePaths:
    def _make_chain(self, mock_client):
        from app.infrastructure.rag.compliance_chain import ComplianceChain
        chain = ComplianceChain()
        chain.client = mock_client
        return chain

    @pytest.mark.asyncio
    async def test_chain_handles_llm_error(self):
        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("Groq API error")
        )

        with patch(
            "app.infrastructure.rag.retriever.regulatory_retriever.retrieve_for_compliance",
            new=AsyncMock(return_value=[]),
        ):
            chain = self._make_chain(mock_client)
            with pytest.raises(ValueError, match="Orchestrator failed: Groq API error"):
                await chain.run("Ginger", direction="import")

    @pytest.mark.asyncio
    async def test_chain_empty_retrieval_sets_retrieval_used_false(self):
        from app.infrastructure.rag.compliance_chain import ImportVerdictResponse

        mock_verdict = ImportVerdictResponse(
            product_name="Ginger",
            status="under_review",
            suggested_hs_code="091011",
            prohibited=False,
            prohibition_reason=None,
            import_duty_percent=None,
            vat_percent=7.5,
            summary="No documents found.",
            what_to_do="Proceed with caution.",
            risks=[],
            compliance_items=[]
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_verdict)

        with patch(
            "app.infrastructure.rag.retriever.regulatory_retriever.retrieve_for_compliance",
            new=AsyncMock(return_value=[]),
        ), patch("duckduckgo_search.DDGS") as mock_ddgs:
            mock_ddgs.return_value.__enter__.return_value.text.return_value = []
            chain = self._make_chain(mock_client)
            verdict = await chain.run("Ginger", direction="import")

            assert verdict.retrieval_used is False
            assert verdict.citations == []

    @pytest.mark.asyncio
    async def test_chain_export_direction_uses_export_schema(self):
        from app.infrastructure.rag.compliance_chain import ExportVerdictResponse

        mock_verdict = ExportVerdictResponse(
            product_name="Ginger",
            status="compliant",
            suggested_hs_code="091011",
            afcfta_eligible=True,
            tariff_saving_percent=10.0,
            roo_eligible=True,
            roo_type="wholly obtained",
            summary="Export OK",
            what_to_do="Apply for COO",
            risks=[],
            compliance_items=[]
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_verdict)

        with patch(
            "app.infrastructure.rag.retriever.regulatory_retriever.retrieve_for_compliance",
            new=AsyncMock(return_value=[]),
        ), patch("duckduckgo_search.DDGS") as mock_ddgs:
            mock_ddgs.return_value.__enter__.return_value.text.return_value = []
            chain = self._make_chain(mock_client)
            verdict = await chain.run("Ginger", direction="export")

            assert verdict.direction == "export"
            assert verdict.afcfta_eligible is True
            assert verdict.roo_eligible is True

    @pytest.mark.asyncio
    async def test_chain_supplementary_context_in_prompt(self):
        from app.infrastructure.rag.compliance_chain import ExportVerdictResponse

        mock_verdict = ExportVerdictResponse(
            product_name="Ginger",
            status="compliant",
            suggested_hs_code="091011",
            afcfta_eligible=True,
            tariff_saving_percent=10.0,
            roo_eligible=True,
            roo_type="wholly obtained",
            summary="OK",
            what_to_do="Proceed",
            risks=[],
            compliance_items=[]
        )

        mock_client = MagicMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_verdict)

        with patch(
            "app.infrastructure.rag.retriever.regulatory_retriever.retrieve_for_compliance",
            new=AsyncMock(return_value=[]),
        ), patch("duckduckgo_search.DDGS") as mock_ddgs:
            mock_ddgs.return_value.__enter__.return_value.text.return_value = []
            chain = self._make_chain(mock_client)
            await chain.run(
                "Ginger",
                direction="export",
                supplementary_context="AfCFTA tariff: 0%",
            )

            call_args = mock_client.chat.completions.create.call_args
            user_prompt = call_args.kwargs["messages"][1]["content"]
            assert "AfCFTA tariff: 0%" in user_prompt


# --- IntelligenceService fallback tests ---

class TestIntelligenceServiceFallback:
    @pytest.mark.asyncio
    async def test_fallback_preserves_supplementary_context(self):
        mock_completion = MagicMock()
        mock_completion.model_dump.return_value = {
            "product_name": "Ginger",
            "status": "compliant",
            "summary": "Export OK",
            "what_to_do": "Apply for COO",
            "risks": [],
            "compliance_items": [],
            "afcfta_eligible": True,
        }

        with patch("app.infrastructure.rag.compliance_chain.compliance_chain") as mock_cc:
            mock_cc.run = AsyncMock(side_effect=Exception("RAG failed"))
            from app.infrastructure.ai.intelligence import IntelligenceService
            service = IntelligenceService()
            service.client = MagicMock()
            service.client.chat.completions.create = AsyncMock(return_value=mock_completion)

            result = await service.analyze_compliance(
                "Ginger",
                hs_code="091011",
                direction="export",
                supplementary_context="AfCFTA tariff: 0%",
            )

            assert result["retrieval_used"] is False
            call_args = service.client.chat.completions.create.call_args
            # For export direction, there is a system message (0), few-shot user (1), few-shot assistant (2), and actual user prompt (3)
            prompt = call_args.kwargs["messages"][3]["content"]
            assert "AfCFTA tariff" in prompt

