"""Integration tests for Compliance FastAPI Router endpoints.

Tests /api/compliance/* endpoints with TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_api_compliance_summary(client: TestClient):
    response = client.get("/api/compliance/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_mps" in data
    assert data["total_mps"] > 0
    assert "target_sc_pct" in data
    assert data["target_sc_pct"] == 15.0
    assert data["target_st_pct"] == 7.5
    assert "national_uc_compliance_rate" in data


def test_api_compliance_earmarking_leaderboard(client: TestClient):
    response = client.get("/api/compliance/earmarking?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert len(data["items"]) <= 5
    if data["items"]:
        item = data["items"][0]
        assert "name" in item
        assert "earmarking_status" in item
        assert "statutory_compliance_grade" in item


def test_api_compliance_negative_list_violations(client: TestClient):
    response = client.get("/api/compliance/negative-list-violations")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data


def test_api_compliance_trust_society_ceiling(client: TestClient):
    response = client.get("/api/compliance/trust-society-ceiling")
    assert response.status_code == 200
    data = response.json()
    assert "statutory_ceiling" in data
    assert "total_breached" in data


def test_api_works_with_compliance_filters(client: TestClient):
    # Test filtering works by beneficiary_type
    res_sc = client.get("/api/works?beneficiary_type=SC_HABITATION&limit=5")
    assert res_sc.status_code == 200
    data_sc = res_sc.json()
    assert "items" in data_sc
    for item in data_sc["items"]:
        assert item["beneficiary_type"] == "SC_HABITATION"
        assert item["is_sc_earmarked"] is True

    # Test filtering works by uc_status
    res_uc = client.get("/api/works?uc_status=OVERDUE&limit=5")
    assert res_uc.status_code == 200
    data_uc = res_uc.json()
    assert "items" in data_uc
    for item in data_uc["items"]:
        assert item["uc_status"] == "OVERDUE"
