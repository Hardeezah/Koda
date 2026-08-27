import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app
from app.api.v1.deps import get_current_user
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
        from app.domain.models.rag import CitedComplianceVerdict, Citation, Risk
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
