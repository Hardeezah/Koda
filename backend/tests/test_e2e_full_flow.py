from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.api.v1.deps import (
    get_current_user,
    get_ledger_repo,
    get_product_repo,
    get_profile_repo,
)
from app.main import app
from app.domain.models import Profile, TradeEntry, ProductMetadata, TradeStatus
from datetime import datetime

client = TestClient(app)

@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: "e2e-test-user-id"
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def mock_dependencies():
    with patch("app.infrastructure.supabase.get_supabase_admin") as mock_supabase, \
         patch("app.infrastructure.redis_client.redis_service.redis") as mock_redis, \
         patch("app.infrastructure.rag.compliance_chain.compliance_chain.graph.ainvoke", new_callable=AsyncMock) as mock_invoke, \
         patch("app.infrastructure.ai.intelligence.intelligence_service.generate_document", new_callable=AsyncMock) as mock_generate_doc:

        # Mock Supabase
        mock_supabase.return_value.from_.return_value.insert.return_value.execute.return_value = {"data": []}

        # Mock Redis
        mock_redis.get.return_value = None

        # Mock LangGraph Output
        from app.domain.models.rag import CitedComplianceVerdict
        mock_invoke.return_value = {
            "verdict": CitedComplianceVerdict(
                product_name="Cocoa Beans",
                status="compliant",
                suggested_hs_code="1801.00",
                summary="E2E Test Summary",
                what_to_do="E2E Step 1",
                risks=[],
                compliance_items=[],
                citations=[],
                direction="export",
                afcfta_eligible=True,
                roo_eligible=True,
                retrieval_used=True,
            )
        }

        # Mock Document Generation
        mock_generate_doc.return_value = {
            "document_name": "Form NXP",
            "estimated_cost": "Varies",
            "estimated_processing": "48 hours",
            "cover_letter": "Dear Customs...",
            "sections": [],
            "submission_steps": ["Step 1"],
            "supporting_documents_checklist": []
        }

        yield {
            "invoke": mock_invoke,
            "gen_doc": mock_generate_doc
        }


def test_e2e_health_check():
    """Verify API is alive"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_e2e_compliance_flow(mock_dependencies):
    """E2E Test: Web app calls /api/v1/compliance/check"""
    payload = {
        "product_name": "Cocoa Beans",
        "direction": "export"
    }
    response = client.post(
        "/api/v1/compliance/check",
        json=payload,
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["product_name"] == "Cocoa Beans"
    assert data["status"] == "compliant"
    assert data["direction"] == "export"

    mock_dependencies["invoke"].assert_called_once()


def test_e2e_afcfta_flow(mock_dependencies):
    """E2E Test: Web app calls /api/v1/afcfta/check"""
    payload = {
        "product_name": "Cocoa Beans",
        "hs_code": "1801.00",
        "destination_country": "Ghana"
    }

    # Needs a mock for query_tariff_schedule etc., since afcfta endpoint does DB lookups
    with patch("app.api.v1.endpoints.afcfta.query_tariff_schedule", new_callable=AsyncMock) as mock_tariff, \
         patch("app.api.v1.endpoints.afcfta.query_roo_requirements", new_callable=AsyncMock) as mock_roo, \
         patch("app.api.v1.endpoints.afcfta.get_supabase_admin") as mock_supa:

        mock_tariff.return_value = {"mfn_rate": 20.0, "afcfta_rate": 0.0}
        mock_roo.return_value = [{"hs_code_prefix": "1801", "rule": "Wholly obtained"}]
        mock_supa.return_value.from_.return_value.insert.return_value.execute.return_value = {"data": []}

        response = client.post(
            "/api/v1/afcfta/check",
            json=payload,
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] is True
        assert data["roo_eligible"] is True
        assert "tariff_saving_percent" in data


def test_e2e_document_generation_flow(mock_dependencies):
    """E2E Test: Web app calls /api/v1/compliance/generate_document"""
    payload = {
        "document_code": "NXP",
        "document_name": "Form NXP",
        "product_name": "Cocoa Beans",
        "direction": "export"
    }
    response = client.post(
        "/api/v1/compliance/generate_document",
        json=payload,
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["document_name"] == "Form NXP"
    assert "cover_letter" in data

    mock_dependencies["gen_doc"].assert_called_once()


def test_e2e_analyze_image(mock_dependencies):
    """E2E Test: Web app calls /api/v1/compliance/analyze_image"""
    payload = {
        "base64_image": "data:image/jpeg;base64,fakeimage",
        "direction": "export"
    }

    with patch("app.infrastructure.ai.intelligence.intelligence_service.analyze_image", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = {
            "product_name": "Cocoa Beans",
            "direction": "export",
            "status": "compliant",
            "visual_analysis": {
                "product_name": "Cocoa Beans",
                "attributes": {},
                "hs_code": {"assigned_code": "1801.00"}
            },
            "summary": "Visual analysis OK",
            "what_to_do": "Proceed",
            "risks": [],
            "compliance_items": []
        }

        response = client.post(
            "/api/v1/compliance/analyze_image",
            json=payload,
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["product_name"] == "Cocoa Beans"
        assert "visual_analysis" in data


def test_e2e_draft_communication():
    """E2E Test: Web app calls /api/v1/communication/draft"""
    # Need to mock the repositories via overrides
    mock_profile_repo = AsyncMock()
    mock_profile_repo.get_by_id.return_value = Profile(id="e2e-test-user-id", business_name="Koda Trade")
    
    mock_ledger_repo = AsyncMock()
    mock_ledger_repo.get_by_profile.return_value = [
        TradeEntry(id="fake-entry-id", profile_id="e2e-test-user-id", product_name="Cocoa Beans", quantity=10, value_usd=100)
    ]

    app.dependency_overrides[get_profile_repo] = lambda: mock_profile_repo
    app.dependency_overrides[get_ledger_repo] = lambda: mock_ledger_repo

    with patch("app.infrastructure.ai.communication.communication_service.draft_broker_email", new_callable=AsyncMock) as mock_draft:
        from app.infrastructure.ai.communication import DraftEmail
        mock_draft.return_value = DraftEmail(
            subject="Trade Inquiry",
            body="Dear Broker...",
            suggested_attachments=["Invoice"]
        )

        response = client.post(
            "/api/v1/communication/draft?entry_id=fake-entry-id",
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["subject"] == "Trade Inquiry"
        assert "body" in data

    # Clear overrides specifically for this test since autouse fixture clears its own
    del app.dependency_overrides[get_profile_repo]
    del app.dependency_overrides[get_ledger_repo]


def test_e2e_orchestration():
    """E2E Test: Web app calls /api/v1/orchestration/process"""
    mock_product_repo = AsyncMock()
    mock_product_repo.get_by_name.return_value = ProductMetadata(
        id="p1", name="Cocoa Beans", hs_code="1801.00", category="agricultural"
    )

    mock_ledger_repo = AsyncMock()
    # create() returns nothing special usually

    app.dependency_overrides[get_product_repo] = lambda: mock_product_repo
    app.dependency_overrides[get_ledger_repo] = lambda: mock_ledger_repo

    with patch("app.infrastructure.ai.intelligence.intelligence_service.analyze_compliance", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = {
            "product_name": "Cocoa Beans",
            "status": "compliant",
            "suggested_hs_code": "1801.00",
            "summary": "OK",
            "what_to_do": "Do it",
            "risks": [],
            "compliance_items": [],
            "citations": [],
            "direction": "export",
            "afcfta_eligible": True,
            "roo_eligible": True,
            "retrieval_used": True,
        }

        payload = {
            "product_name": "Cocoa Beans",
            "quantity": 100.0,
            "value_usd": 5000.0
        }

        response = client.post(
            "/api/v1/orchestration/process",
            json=payload,
            headers={"Authorization": "Bearer fake_token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "entry_id" in data
        assert data["product_metadata"]["name"] == "Cocoa Beans"
        assert data["compliance_report"]["status"] == "compliant"

    del app.dependency_overrides[get_product_repo]
    del app.dependency_overrides[get_ledger_repo]


def test_e2e_get_ledger():
    """E2E Test: Web app calls /api/v1/ledger/{profile_id}"""
    mock_ledger_repo = AsyncMock()
    mock_ledger_repo.get_by_profile.return_value = [
        TradeEntry(id="e1", profile_id="e2e-test-user-id", product_name="Cocoa", quantity=10, value_usd=100, status=TradeStatus.COMPLIANT),
        TradeEntry(id="e2", profile_id="e2e-test-user-id", product_name="Ginger", quantity=5, value_usd=50, status=TradeStatus.NON_COMPLIANT),
    ]

    app.dependency_overrides[get_ledger_repo] = lambda: mock_ledger_repo

    response = client.get(
        "/api/v1/ledger/e2e-test-user-id",
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["product_name"] == "Cocoa"
    assert data[1]["status"] == "non_compliant"

    del app.dependency_overrides[get_ledger_repo]


def test_e2e_profile():
    """E2E Test: Web app calls /api/v1/profile"""
    mock_profile_repo = AsyncMock()
    mock_profile_repo.get_by_id.return_value = Profile(
        id="e2e-test-user-id",
        business_name="Koda Trade Test",
        email="test@example.com"
    )

    app.dependency_overrides[get_profile_repo] = lambda: mock_profile_repo

    response = client.get(
        "/api/v1/profile/e2e-test-user-id",
        headers={"Authorization": "Bearer fake_token"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "e2e-test-user-id"
    assert data["business_name"] == "Koda Trade Test"
    assert data["email"] == "test@example.com"

    del app.dependency_overrides[get_profile_repo]
