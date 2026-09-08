"""
Forensic Audit Stress Test Suite — SETU MPLADS Anomaly Detection Platform
Validates all 10 edge-case scenarios from the audit stress-test report to guarantee
false positives on legitimate works are eliminated and genuine evasions are detected.
"""
import pytest
import numpy as np
import pandas as pd
from app.services.live_inference_service import LiveInferenceService
from app.ml.features.duplicate_detector import detect_exact_duplicates
from app.ml.features.vendor_concentration import compute_vendor_concentration
from app.ml.features.stall_detector import detect_stall_risk
from app.ml.features.structuring_detector import detect_structuring
from app.ml.features.peer_zscore import compute_peer_zscores
from app.ml.models.financial.isolation_forest_model import FinancialIsolationForestModel
from app.ml.models.risk_fusion_engine import RiskFusionEngine


@pytest.fixture(scope="module")
def live_service():
    return LiveInferenceService.get_instance()


def test_scenario_1_high_value_hospital_not_critical(live_service):
    """Scenario 1: ₹4.5Cr Sub-Divisional Hospital Complex must not be flagged CRITICAL or GHOST_WORK."""
    proposal = {
        "project_id": "TEST-HVL-001",
        "work_name": "Construction of 100-Bed Sub-Divisional Hospital Complex",
        "work_type": "Civil Infrastructure",
        "category": "Health and Family Welfare",
        "state": "Bihar",
        "constituency": "Darbhanga",
        "sanctioned_amount": 45000000.0,
        "estimated_cost": 45000000.0,
        "planned_duration_days": 540,
        "num_bidders": 5,
        "contractor_past_delays": 0,
    }
    result = live_service.score_raw_proposal(proposal)
    assert result["overall_risk_score"] < 50.0, f"Hospital scored {result['overall_risk_score']}, expected < 50.0"
    assert result["risk_level"] in ["LOW", "MEDIUM"], f"Hospital risk level {result['risk_level']}, expected LOW/MEDIUM"
    assert result["primary_typology"] != "GHOST_WORK", "Hospital incorrectly assigned GHOST_WORK typology"
    assert result["approval_recommendation"] != "REJECT_AND_INVESTIGATE"


def test_scenario_2_remote_single_bid_not_collusive(live_service):
    """Scenario 2: Remote border link road under GFR Rule 166 single-bid must not force CRITICAL/collusion."""
    proposal = {
        "project_id": "TEST-REMOTE-002",
        "work_name": "Construction of Border Link Road in Hilly Terrain",
        "work_type": "Roads and Bridges",
        "category": "Public Infrastructure",
        "state": "Uttarakhand",
        "constituency": "Tehri Garhwal",
        "sanctioned_amount": 2500000.0,
        "estimated_cost": 2500000.0,
        "planned_duration_days": 180,
        "num_bidders": 1,
        "is_single_bid": True,
        "contractor_past_delays": 0,
    }
    result = live_service.score_raw_proposal(proposal)
    assert result["overall_risk_score"] < 50.0, f"Remote road scored {result['overall_risk_score']}, expected < 50.0"
    assert result["approval_recommendation"] in ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL"]
    # Check that fabricated 99% collusion attributes are not generated
    assert result["sub_scores"]["graph"] < 70.0


def test_scenario_3_multi_village_rollout_not_duplicates():
    """Scenario 3: 20 standardized hand pumps across 20 distinct villages must not be flagged duplicates."""
    df_pumps = pd.DataFrame([
        {
            "MP_NAME": "Mr Gopal Jee Thakur",
            "WORK": "Installation of Community Hand Pump and Borewell",
            "ALLOCATION_AMOUNT": 63275.0,
            "STATE": "Bihar",
            "DISTRICT": "Darbhanga",
            "BLOCK": f"Block_{i%5}",
            "VILLAGE": f"Village_{i}",
        } for i in range(20)
    ])
    df_dupes = detect_exact_duplicates(df_pumps)
    assert df_dupes["DUPLICATE_COUNT"].max() == 1, "Hand pumps across distinct villages were grouped together as duplicates"
    assert df_dupes["IS_DUPLICATE_CANDIDATE"].sum() == 0, "Clean multi-village hand pumps flagged as duplicate candidates"


def test_scenario_4_district_magistrate_statutory_exemption():
    """Scenario 4: District Magistrate (constitutional IDA) must not be flagged as a vendor monopoly."""
    df_dm = pd.DataFrame({
        "MP_NAME": ["Mr Gopal Jee Thakur"] * 40,
        "IDA": ["DISTRICT MAGISTRATE DARBHANGA"] * 36 + ["PWD DARBHANGA"] * 4,
        "ALLOCATION_AMOUNT": [100000.0] * 40,
    })
    df_vendor = compute_vendor_concentration(df_dm)
    assert not df_vendor["IS_VENDOR_MONOPOLY"].iloc[0], "District Magistrate was falsely flagged as vendor monopoly"


def test_scenario_5_legitimate_4_5l_ro_plant_not_framed(live_service):
    """Scenario 5: Legitimate ₹4.5L RO plant must not be framed with high payment fraud score."""
    proposal = {
        "project_id": "TEST-STRUCT-003",
        "work_name": "Installation of Community Drinking Water RO Plant",
        "work_type": "Drinking Water",
        "category": "Drinking Water Facility",
        "state": "Rajasthan",
        "constituency": "Barmer",
        "sanctioned_amount": 450000.0,
        "estimated_cost": 450000.0,
        "planned_duration_days": 90,
        "num_bidders": 4,
        "contractor_past_delays": 0,
    }
    result = live_service.score_raw_proposal(proposal)
    assert result["overall_risk_score"] < 45.0, f"RO Plant scored {result['overall_risk_score']}, expected < 45.0"
    assert result["sub_scores"]["payment"] <= 45.0, f"Payment score {result['sub_scores']['payment']}, expected <= 45.0"
    assert result["approval_recommendation"] in ["AUTOMATIC_CLEARANCE", "CONDITIONAL_APPROVAL"]


def test_scenario_6_split_contract_detected():
    """Scenario 6: Split contract (2 x ₹3.95L) by same contractor in same constituency must be detected."""
    df_split = pd.DataFrame([
        {
            "CONTRACTOR": "ABC Infra Pvt Ltd",
            "CONSTITUENCY": "Indore",
            "WORK": "Paving of Internal Village Road Segment A",
            "ALLOCATION_AMOUNT": 395000.0,
        },
        {
            "CONTRACTOR": "ABC Infra Pvt Ltd",
            "CONSTITUENCY": "Indore",
            "WORK": "Paving of Internal Village Road Segment B",
            "ALLOCATION_AMOUNT": 395000.0,
        },
    ])
    df_struct = detect_structuring(df_split)
    assert df_struct["IS_STRUCTURED_CANDIDATE"].all(), "Multi-row split contracts were not detected"
    assert df_struct["STRUCTURING_SCORE"].max() >= 0.70, "Structuring score too low for split contracts"


def test_scenario_7_missing_estimated_cost_flagged_unverified(live_service):
    """Scenario 7: Missing estimated_cost must produce an explicit unverified cost reason trace."""
    proposal = {
        "project_id": "TEST-INFLATE-004",
        "work_name": "Installation of 10 Solar Street Lights",
        "work_type": "Rural Electrification",
        "category": "Energy",
        "state": "Uttar Pradesh",
        "constituency": "Varanasi",
        "sanctioned_amount": 15000000.0,
        "num_bidders": 3,
        "contractor_past_delays": 0,
    }
    result = live_service.score_raw_proposal(proposal)
    all_reasons = " ".join(result["synthesized_reasons"]).lower()
    assert "not provided" in all_reasons or "cannot be verified" in all_reasons, (
        f"Missing estimate reason not found in traces: {result['synthesized_reasons']}"
    )


def test_scenario_8_cost_reduction_reason_trace():
    """Scenario 8: Cost reduction (-7.8%) must be labeled as scope reduction, not contract escalation."""
    fif = FinancialIsolationForestModel()
    row_scenario_8 = pd.Series({
        "contract__contract_value_change": -0.078,
        "contract__contract_amendment_count": 4,
        "contract__amendment_value": 0.0,
        "financial__sanction_to_estimate_ratio": 0.92,
        "peer__payment_velocity_work_type_robust_z": 0.1,
        "peer__payment_velocity_ratio_work_type_median": 1.0,
        "payment__payment_timing_anomaly_rate": 0.0,
        "payment__round_number_payment_rate": 0.0,
    })
    df_row = pd.DataFrame([row_scenario_8])
    traces_df = fif.generate_reason_traces(df_row, np.array([88.9]), np.array([98.5]))
    reasons = [v for v in traces_df.iloc[0].to_dict().values() if v]
    assert not any("escalation" in r.lower() for r in reasons), f"Hallucinatory 'escalation' text found in: {reasons}"
    assert any("reduction" in r.lower() or "decrease" in r.lower() for r in reasons), f"Expected reduction text in: {reasons}"


def test_scenario_9_fusion_weights_calibration():
    """Scenario 9: Fusion weights must properly represent contractor and graph models without progress dominance."""
    fusion = RiskFusionEngine()
    contractor_weight = fusion.weights.get("contractor_anomaly_score", 0)
    graph_weight = fusion.weights.get("graph_anomaly_score", 0)
    progress_weight = fusion.weights.get("progress_anomaly_score", 0)
    assert (contractor_weight + graph_weight) >= 0.30, "Contractor + Graph weights too low"
    assert progress_weight <= 0.15, "Progress weight dominates excessively"


def test_scenario_10_multi_year_bridge_not_stalled():
    """Scenario 10: 540-day bridge at day 400 must not be flagged as stalled or ghost candidate."""
    df_bridge = pd.DataFrame([{
        "DAYS_SINCE_RECOMMENDED": 400,
        "STATUS": "Ongoing",
        "IDA_APPROVAL": "Approved",
        "PLANNED_DURATION_DAYS": 540,
    }])
    df_stall = detect_stall_risk(df_bridge)
    assert not df_stall["IS_GHOST_CANDIDATE"].iloc[0], "On-schedule multi-year bridge falsely marked as ghost candidate"
    assert df_stall["STALL_RISK_SCORE"].iloc[0] <= 0.10, f"Stall risk score {df_stall['STALL_RISK_SCORE'].iloc[0]} too high for on-schedule work"
