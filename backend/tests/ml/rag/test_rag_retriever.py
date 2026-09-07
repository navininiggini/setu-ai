"""Unit tests for Phase 1: External RAG Knowledge Base and Retriever Engine."""

import pytest
from app.ml.rag.knowledge_base import RAGKnowledgeBase
from app.ml.rag.retriever import RAGRetriever


@pytest.fixture
def retriever():
    return RAGRetriever()


def test_statutory_rules_retrieval(retriever):
    """Verify statutory rules retrieval matches anomaly typology."""
    rules_structuring = retriever.get_statutory_rules("Artificial Contract Splitting (<Rs. 5L GFR 155)")
    titles = [r["title"] for r in rules_structuring]
    assert any("Rule 155" in t for t in titles)
    assert any("Rule 161" in t for t in titles)

    rules_monopoly = retriever.get_statutory_rules("Interstate Single Bidder Monopoly")
    titles_mono = [r["title"] for r in rules_monopoly]
    assert any("Rule 173" in t for t in titles_mono)


def test_flood_zone_detection(retriever):
    """Verify flood and waterlogging zone detection for vulnerable districts."""
    assert retriever.is_flood_calamity_zone("Darbhanga") is True
    assert retriever.is_flood_calamity_zone("Saran") is True
    assert retriever.is_flood_calamity_zone("Madhubani") is True
    assert retriever.is_flood_calamity_zone("Gorakhpur") is True
    assert retriever.is_flood_calamity_zone("Bangalore Urban") is False


def test_monsoon_window_detection(retriever):
    """Verify statutory monsoon moratorium detection (June 15 – October 15)."""
    assert retriever.is_in_monsoon_window("2024-07-20") is True
    assert retriever.is_in_monsoon_window("2024-08-15") is True
    assert retriever.is_in_monsoon_window("2024-06-25") is True
    assert retriever.is_in_monsoon_window("2024-10-10") is True

    assert retriever.is_in_monsoon_window("2024-01-15") is False
    assert retriever.is_in_monsoon_window("2024-11-20") is False
    assert retriever.is_in_monsoon_window("2024-05-01") is False


def test_election_mcc_detection(retriever):
    """Verify ECI Model Code of Conduct 2024 General Election freeze window."""
    is_mcc, window = retriever.is_in_election_blackout("2024-04-15")
    assert is_mcc is True
    assert window is not None
    assert "2024 Lok Sabha" in window["event"]

    is_mcc_out, window_out = retriever.is_in_election_blackout("2024-08-20")
    assert is_mcc_out is False
    assert window_out is None


def test_agency_classification(retriever):
    """Verify classification of statutory public line departments vs private contractors."""
    pwd_info = retriever.classify_agency("Executive Engineer, State PWD Road Division")
    assert pwd_info["is_statutory_public_body"] is True
    assert pwd_info["type"] == "STATUTORY_GOVERNMENT_AGENCY"

    bridge_info = retriever.classify_agency("Bihar Rajya Pul Nirman Nigam Ltd")
    assert bridge_info["is_statutory_public_body"] is True

    private_info = retriever.classify_agency("M/S Krishna Infra Developers Pvt Ltd")
    assert private_info["is_statutory_public_body"] is False
    assert private_info["type"] == "TENDERED_PRIVATE_ENTITY"


def test_sor_benchmark_matching(retriever):
    """Verify matching against standard Schedule of Rates unit community assets."""
    match_solar = retriever.match_sor_benchmark("Installation of Solar High Mast Light at Haat Chowk", 485000.0)
    assert match_solar is not None
    assert match_solar["is_mitigated_sor_unit"] is True
    assert match_solar["benchmark_category"] == "solar_high_mast"

    # Civil road paving should not match solar SoR
    match_road = retriever.match_sor_benchmark("Construction of Bitumen Road from Main Road to School", 495000.0)
    assert match_road is None


def test_retrieve_context_end_to_end(retriever):
    """Verify complete contextual payload aggregation and hard-negative identification."""
    sample_works = [
        {
            "id": "MPLADS-001",
            "work": "Installation of Solar High Mast Light at Panchayat Bhawan",
            "allocation_amount": 485000.0,
            "recommended_date": "2024-04-20",
            "ida": "District Rural Development Agency (DRDA)",
            "risk_score": 82.0
        },
        {
            "id": "MPLADS-002",
            "work": "Civil Paving of Village Approach Road Package 3",
            "allocation_amount": 498000.0,
            "recommended_date": "2024-01-10",
            "ida": "Sharma Civil Contractors Pvt Ltd",
            "risk_score": 89.0
        }
    ]

    context = retriever.retrieve_context(
        role="district",
        jurisdiction="Darbhanga",
        metrics={"top_typology": "Artificial Contract Splitting (<Rs. 5L GFR 155)"},
        sample_works=sample_works
    )

    assert context["jurisdiction"] == "Darbhanga"
    assert context["is_flood_calamity_zone"] is True
    assert len(context["statutory_rules"]) >= 2
    assert len(context["analyzed_sample_works"]) == 2

    # Work 1 has mitigations (DRDA public agency + ECI MCC freeze date + Solar SoR unit)
    w1 = context["analyzed_sample_works"][0]
    assert w1["is_hard_negative"] is True
    assert len(w1["mitigations"]) >= 2
    assert len(w1["confirmed_flags"]) == 0

    # Work 2 is private entity near Rs. 5L without SoR exemption
    w2 = context["analyzed_sample_works"][1]
    assert w2["is_hard_negative"] is False
    assert len(w2["confirmed_flags"]) >= 1
