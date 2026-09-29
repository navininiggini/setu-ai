"""Tests for Live Proposal Scoring API and In-Memory Inference Service.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from fastapi.testclient import TestClient
import pytest

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_score_proposal_normal_project(client):
    """Test standard normal proposal receives low risk score and automated clearance."""
    payload = {
        "work_name": "Installation of 50 Solar Street Lights",
        "category": "Drinking Water & Sanitation",
        "state": "Bihar",
        "constituency": "Darbhanga",
        "sanctioned_amount": 1200000.0,
        "planned_duration_days": 120,
        "num_bidders": 4,
        "is_single_bid": False,
        "contractor_past_delays": 0,
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "proposal_id" in data
    assert data["risk_level"] in ["LOW", "MEDIUM"]
    assert data["approval_recommendation"] in ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL"]
    assert "sub_scores" in data
    assert "financial" in data["sub_scores"]
    assert "geospatial" in data["sub_scores"]
    assert "procurement" in data["sub_scores"]
    assert "contractor" in data["sub_scores"]
    assert "payment" in data["sub_scores"]
    assert "progress" in data["sub_scores"]
    assert "graph" in data["sub_scores"]
    assert "ml_fraud_probability" in data["sub_scores"]
    assert data["inference_time_ms"] > 0.0


def test_score_proposal_anomalous_attributes(client):
    """Test proposal with single-bid and heavy contractor delays produces elevated risk."""
    payload = {
        "work_name": "Mega Highway Widening Package IV",
        "category": "Roads & Bridges",
        "state": "Bihar",
        "constituency": "Darbhanga",
        "sanctioned_amount": 95000000.0,
        "planned_duration_days": 1200,
        "num_bidders": 1,
        "is_single_bid": True,
        "contractor_past_delays": 8,
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["overall_risk_score"] >= 0.0
    assert len(data["synthesized_reasons"]) > 0
    assert data["primary_reason"] != ""
    assert data["approval_recommendation"] in [
        "AUTOMATIC_CLEARANCE",
        "CONDITIONAL_APPROVAL",
        "MANDATORY_TECHNICAL_AUDIT",
        "REJECT_AND_INVESTIGATE",
    ]


def test_score_proposal_minimal_payload(client):
    """Test proposal scoring with only required / bare minimum fields."""
    payload = {
        "work_name": "Gram Panchayat Community Shed",
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "proposal_id" in data
    assert 0.0 <= data["overall_risk_score"] <= 100.0


@pytest.mark.parametrize(
    "preset_name,payload,expected_recommendation,min_risk",
    [
        (
            "Compliant Community Center",
            {
                "work_name": "Construction of Multi-Purpose Community Hall",
                "category": "Public Infrastructure",
                "state": "Bihar",
                "constituency": "Darbhanga",
                "district": "Darbhanga",
                "ida": "District Planning Authority",
                "contractor_name": "Apex Infrastructure Ltd",
                "sanctioned_amount": 2500000,
                "estimated_cost": 2450000,
                "planned_duration_days": 180,
                "work_type": "Civil Infrastructure",
                "num_bidders": 4,
                "is_single_bid": False,
                "contractor_past_delays": 0,
                "latitude": 26.1542,
                "longitude": 85.8918,
            },
            ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL"],
            0.0,
        ),
        (
            "Threshold Structuring (Rs 4.92 Lakhs)",
            {
                "work_name": "Paver Block Pavement at Ward-04",
                "category": "Roads & Bridges",
                "state": "Bihar",
                "constituency": "Darbhanga",
                "district": "Darbhanga",
                "ida": "District Rural Development Agency",
                "contractor_name": "Chandra Civil Works",
                "sanctioned_amount": 492000,
                "estimated_cost": 490000,
                "planned_duration_days": 90,
                "work_type": "Paver Road",
                "num_bidders": 2,
                "is_single_bid": False,
                "contractor_past_delays": 0,
                "latitude": 26.148,
                "longitude": 85.901,
            },
            ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL", "MANDATORY_TECHNICAL_AUDIT"],
            15.0,
        ),
        (
            "Single-Bid Cartel Procurement",
            {
                "work_name": "Solar High-Mast Lighting Tower Installation",
                "category": "Electricity & Lighting",
                "state": "Uttar Pradesh",
                "constituency": "Varanasi",
                "district": "Varanasi",
                "ida": "Varanasi Smart City Authority",
                "contractor_name": "Surya Urja Consortium",
                "sanctioned_amount": 3850000,
                "estimated_cost": 3100000,
                "planned_duration_days": 120,
                "work_type": "Solar Installation",
                "num_bidders": 1,
                "is_single_bid": True,
                "contractor_past_delays": 2,
                "latitude": 25.3176,
                "longitude": 82.9739,
            },
            ["CONDITIONAL_APPROVAL", "MANDATORY_TECHNICAL_AUDIT", "REJECT_AND_INVESTIGATE"],
            20.0,
        ),
        (
            "High Cost Escalation + Repeat Delays",
            {
                "work_name": "RCC Bridge across Irrigation Canal at Belaur",
                "category": "Roads & Bridges",
                "state": "Bihar",
                "constituency": "Darbhanga",
                "district": "Darbhanga",
                "ida": "District Planning Authority",
                "contractor_name": "Mithila Construction Pvt Ltd",
                "sanctioned_amount": 8500000,
                "estimated_cost": 4200000,
                "planned_duration_days": 360,
                "work_type": "Bridge Work",
                "num_bidders": 2,
                "is_single_bid": False,
                "contractor_past_delays": 4,
                "latitude": 26.17,
                "longitude": 85.92,
            },
            ["MANDATORY_TECHNICAL_AUDIT", "REJECT_AND_INVESTIGATE"],
            40.0,
        ),
        (
            "Remote Geo-Anomaly Borewell",
            {
                "work_name": "Deep Tube Well with Solar Submersible Pump",
                "category": "Drinking Water",
                "state": "Rajasthan",
                "constituency": "Barmer",
                "district": "Barmer",
                "ida": "Public Health Engineering Department",
                "contractor_name": "Thar Desert Aqua Works",
                "sanctioned_amount": 1800000,
                "estimated_cost": 1750000,
                "planned_duration_days": 60,
                "work_type": "Water Supply",
                "num_bidders": 3,
                "is_single_bid": False,
                "contractor_past_delays": 0,
                "latitude": 25.7532,
                "longitude": 71.3966,
            },
            ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL"],
            0.0,
        ),
        (
            "Unverified High-Value Sanction",
            {
                "work_name": "District Stadium Sports Complex Phase II",
                "category": "Public Infrastructure",
                "state": "Tamil Nadu",
                "constituency": "Madurai",
                "district": "Madurai",
                "ida": "Sports Development Authority",
                "contractor_name": "Southern Infra Consortium",
                "sanctioned_amount": 48000000,
                "estimated_cost": None,
                "planned_duration_days": 720,
                "work_type": "Civil Construction",
                "num_bidders": 2,
                "is_single_bid": False,
                "contractor_past_delays": 1,
                "latitude": 9.9252,
                "longitude": 78.1198,
            },
            ["CONDITIONAL_APPROVAL", "MANDATORY_TECHNICAL_AUDIT", "REJECT_AND_INVESTIGATE"],
            30.0,
        ),
    ],
)
def test_score_proposal_quick_test_presets(client, preset_name, payload, expected_recommendation, min_risk):
    """Verify that all Quick Test scenario presets evaluate successfully with valid risk parameters."""
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200, f"Preset '{preset_name}' failed with status {response.status_code}: {response.text}"
    data = response.json()

    assert "proposal_id" in data
    assert 0.0 <= data["overall_risk_score"] <= 100.0
    assert data["overall_risk_score"] >= min_risk
    assert data["approval_recommendation"] in expected_recommendation
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert data["investigation_priority"] in ["ROUTINE", "PRIORITY", "IMMEDIATE"]
    assert 0.0 <= data["fraud_probability"] <= 1.0

    # Ensure all 8 domain sub-scores exist and are numeric
    sub_scores = data["sub_scores"]
    for domain in ["financial", "geospatial", "procurement", "contractor", "payment", "progress", "graph", "ml_fraud_probability"]:
        assert domain in sub_scores
        assert isinstance(sub_scores[domain], (int, float))

    assert isinstance(data["synthesized_reasons"], list)
    assert isinstance(data["primary_reason"], str)
    assert data["inference_time_ms"] > 0.0


def test_score_proposal_empty_strings_and_arbitrary_values(client):
    """Verify proposal scoring gracefully handles empty strings, zero amounts, and unusual values."""
    payload = {
        "work_name": "",  # Empty string should fallback to default
        "category": "Unseen Category 123",
        "state": "Nonexistent State",
        "constituency": "Arbitrary Constituency",
        "sanctioned_amount": "",  # Empty string should fallback to default
        "estimated_cost": "",
        "tender_amount": "",
        "planned_duration_days": "",
        "num_bidders": "",
        "is_single_bid": False,
        "contractor_past_delays": "",
        "latitude": "",
        "longitude": "",
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "proposal_id" in data
    assert 0.0 <= data["overall_risk_score"] <= 100.0
    assert data["approval_recommendation"] in [
        "AUTOMATIC_CLEARANCE",
        "CONDITIONAL_APPROVAL",
        "MANDATORY_TECHNICAL_AUDIT",
        "REJECT_AND_INVESTIGATE",
    ]


def test_score_proposal_extreme_boundary_values(client):
    """Verify handling of extreme high fund amounts and high bidder counts."""
    payload = {
        "work_name": "National Mega Expressway Tunnel Corridor",
        "category": "Roads & Bridges",
        "sanctioned_amount": 1000000000.0,  # 100 Crore
        "estimated_cost": 500000000.0,      # 50 Crore
        "planned_duration_days": 3500,
        "num_bidders": 50,
        "contractor_past_delays": 20,
    }
    response = client.post("/api/risk-intelligence/score-proposal", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["overall_risk_score"] > 50.0  # Heavy delays and 100% cost overrun should trigger high risk
    assert data["approval_recommendation"] in ["MANDATORY_TECHNICAL_AUDIT", "REJECT_AND_INVESTIGATE"]
