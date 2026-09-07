import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["platform"] == "SETU"

    h = client.get("/health")
    assert h.status_code == 200
    assert h.json()["status"] == "healthy"

def test_dashboard_endpoints():
    # Ministry
    res_min = client.get("/api/dashboard?role=ministry")
    assert res_min.status_code == 200
    data = res_min.json()
    assert "summary" in data
    assert data["summary"]["total_works"] > 0
    assert "fraud_breakdown" in data

    # State (Bihar)
    res_state = client.get("/api/dashboard?role=state&jurisdiction=Bihar")
    assert res_state.status_code == 200

    # District (DARBHANGA)
    res_dist = client.get("/api/dashboard?role=district&jurisdiction=DARBHANGA")
    assert res_dist.status_code == 200

    # MP
    res_mp = client.get("/api/dashboard?role=mp&jurisdiction=Mr Gopal Jee Thakur")
    assert res_mp.status_code == 200

def test_works_listing_and_filters():
    res = client.get("/api/works?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 10
    first_id = data["items"][0]["id"]

    # Detail
    res_det = client.get(f"/api/works/{first_id}")
    assert res_det.status_code == 200
    detail = res_det.json()
    assert "risk_score" in detail
    assert "explanation" in detail

    # Filters
    res_filt = client.get("/api/works/filters")
    assert res_filt.status_code == 200
    assert "states" in res_filt.json()

def test_geo_and_graph_endpoints():
    res_choro = client.get("/api/geo/states-choropleth")
    assert res_choro.status_code == 200
    assert len(res_choro.json()) > 0

    res_dist = client.get("/api/geo/district-drilldown?state=Bihar")
    assert res_dist.status_code == 200

    res_pins = client.get("/api/geo/pins?limit=20")
    assert res_pins.status_code == 200

    res_graph = client.get("/api/graph/network?max_nodes=50")
    assert res_graph.status_code == 200
    assert "nodes" in res_graph.json()
    assert "links" in res_graph.json()

def test_alerts_and_cases():
    res_alerts = client.get("/api/alerts")
    assert res_alerts.status_code == 200

    res_cases = client.get("/api/cases")
    assert res_cases.status_code == 200
    cases_list = res_cases.json()
    if len(cases_list) > 0:
        c_id = cases_list[0]["id"]
        # Authenticate as ministry user
        login_res = client.post("/api/auth/login", json={"username": "ministry", "password": "any"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        res_patch = client.patch(
            f"/api/cases/{c_id}/status",
            json={"status": "under_review", "note": "Field audit started"},
            headers=headers
        )
        assert res_patch.status_code == 200
        assert res_patch.json()["status"] == "under_review"

def test_model_metrics_and_future_stubs():
    res_metrics = client.get("/api/model-metrics")
    assert res_metrics.status_code == 200
    assert res_metrics.json()["roc_auc"] >= 0.85

    res_future = client.get("/api/future/cost-benchmark")
    assert res_future.status_code == 200
    assert res_future.json()["status"] == "coming_soon"
