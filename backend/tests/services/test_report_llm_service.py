"""Unit tests for Phase 2: RAG-Augmented Audit Intelligence & Hard-Negative Detection (report_llm_service.py)."""

import pytest
from app.services.report_llm_service import (
    synthesize_report_intelligence,
    _get_fallback_report_intelligence,
    _build_report_prompt,
    REPORT_INTELLIGENCE_SCHEMA
)

BANNED_BUZZWORDS = [
    "algorithmic surveillance",
    "econometric profiling",
    "cross-state cartel funnels",
    "structural vulnerability",
    "sovereign oversight authority",
    "strategic agency concentration",
    "panoptic",
    "tapestry",
    "nexus",
    "synergistic",
    "transformative"
]


@pytest.fixture
def sample_metrics():
    return {
        "total_works": 128,
        "total_outlay": 52114800.0,
        "flagged_count": 23,
        "amount_at_risk": 11500000.0,
        "avg_risk": 74.5,
        "hhi": 799.8,
        "syndicate_count": 3,
        "top_typology": "Artificial Contract Splitting (<Rs. 5L GFR 155)"
    }


@pytest.fixture
def sample_top_works():
    return [
        {
            "id": "MPLADS-001",
            "work": "Installation of Solar High Mast Light at Chowk",
            "allocation_amount": 485000.0,
            "recommended_date": "2024-04-10",
            "ida": "District Rural Development Agency (DRDA)",
            "risk_score": 78.0
        },
        {
            "id": "MPLADS-002",
            "work": "Civil Paving of Approach Road Package 1",
            "allocation_amount": 498000.0,
            "recommended_date": "2024-01-15",
            "ida": "Sharma Civil Contractors Pvt Ltd",
            "risk_score": 88.0
        }
    ]


def test_ministry_narrative_synthesis(sample_metrics):
    """Verify Ministry report narrative contains PAC oversight directives and valid schema."""
    res = synthesize_report_intelligence(role="ministry", jurisdiction="National", metrics=sample_metrics)
    assert isinstance(res, dict)
    assert "executive_summary" in res
    assert "real_world_evaluation" in res
    assert "key_findings" in res
    assert "procedural_directives" in res
    assert len(res["key_findings"]) == 3
    assert len(res["procedural_directives"]) == 3

    directives_text = " ".join(res["procedural_directives"])
    assert any(term in directives_text.lower() for term in ["pac", "public accounts", "cag", "vigilance", "sanction"])


def test_zero_buzzwords_enforcement(sample_metrics, sample_top_works):
    """Verify generated text is free from banned dramatic or academic AI buzzwords."""
    for role in ["ministry", "state", "district", "mp"]:
        res = synthesize_report_intelligence(
            role=role,
            jurisdiction="Darbhanga",
            metrics=sample_metrics,
            top_works=sample_top_works
        )
        full_text = (
            res["executive_summary"] + " " +
            res["real_world_evaluation"] + " " +
            " ".join(res["key_findings"]) + " " +
            " ".join(res["procedural_directives"])
        ).lower()

        for buzzword in BANNED_BUZZWORDS:
            assert buzzword not in full_text, f"Banned buzzword '{buzzword}' detected in {role} output"


def test_district_hard_negative_mitigation(sample_metrics, sample_top_works):
    """Verify District report evaluates monsoon moratorium and statutory public body factors."""
    res = synthesize_report_intelligence(
        role="district",
        jurisdiction="Darbhanga",
        metrics=sample_metrics,
        top_works=sample_top_works
    )
    assert "Darbhanga" in res["executive_summary"]
    assert "real_world_evaluation" in res

    eval_text = res["real_world_evaluation"].lower()
    # Check that flood zone, monsoon moratorium, or statutory agency execution is evaluated
    assert any(term in eval_text for term in ["flood", "monsoon", "public", "drda", "pwd", "statutory"])

    # Procedural directives must contain actionable magisterial remedies
    directives_text = " ".join(res["procedural_directives"]).lower()
    assert any(term in directives_text for term in ["stop-work", "measurement book", "engineer", "freeze", "inspect"])


def test_mp_narrative_synthesis(sample_metrics):
    """Verify MP report narrative focuses on constituency asset velocity and parliamentary review."""
    res = synthesize_report_intelligence(role="mp", jurisdiction="Mr Gopal Jee Thakur", metrics=sample_metrics)
    assert "Mr Gopal Jee Thakur" in res["executive_summary"]
    assert "real_world_evaluation" in res
    assert len(res["key_findings"]) == 3
    assert len(res["procedural_directives"]) == 3


def test_fallback_guarantee_offline(sample_metrics, sample_top_works):
    """Verify deterministic fallback functions cleanly without raising exceptions."""
    for role in ["ministry", "state", "district", "mp"]:
        res = _get_fallback_report_intelligence(role, "Test Jurisdiction", sample_metrics)
        assert isinstance(res["executive_summary"], str)
        assert isinstance(res["real_world_evaluation"], str)
        assert len(res["key_findings"]) == 3
        assert len(res["procedural_directives"]) == 3
        assert ("Rs." in res["executive_summary"] or "₹" in res["executive_summary"])
