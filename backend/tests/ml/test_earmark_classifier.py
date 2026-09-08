"""Unit tests for Statutory Earmark Classifier.

Tests deterministic SC/ST Habitation identification under MoSPI Guidelines 2023 Para 2.5.
"""

import pytest
from app.ml.features.earmark_classifier import (
    classify_beneficiary_type,
    compute_earmarking_status,
    compute_compliance_grade,
)


def test_classify_beneficiary_type_sc_explicit():
    row = {
        "work": "Construction of CC Road in Scheduled Caste Basti Ward-4",
        "category": "Roads & Bridges",
        "ward": "SC Mohalla",
        "constituency": "General Seat",
    }
    assert classify_beneficiary_type(row) == "SC_HABITATION"


def test_classify_beneficiary_type_st_explicit():
    row = {
        "work": "Community Hall in Tribal Hamlet Adivasi Basti",
        "category": "Community Infrastructure",
        "ward": "Forest Range",
        "constituency": "General Seat",
    }
    assert classify_beneficiary_type(row) == "ST_HABITATION"


def test_classify_beneficiary_type_st_reserved_constituency():
    row = {
        "work": "Installation of Solar Lights in Village Chowk",
        "category": "Electricity",
        "constituency": "Mandla (ST)",
    }
    assert classify_beneficiary_type(row) == "ST_HABITATION"


def test_classify_beneficiary_type_sc_reserved_constituency():
    row = {
        "work": "Installation of Solar Lights in Village Chowk",
        "category": "Electricity",
        "constituency": "Gaya (SC)",
    }
    assert classify_beneficiary_type(row) == "SC_HABITATION"


def test_compute_earmarking_status_compliant():
    status = compute_earmarking_status(sc_pct=16.5, st_pct=8.0)
    assert status == "COMPLIANT"


def test_compute_earmarking_status_deficit():
    # Between 8-15% SC or 3-7.5% ST
    status = compute_earmarking_status(sc_pct=12.0, st_pct=8.0)
    assert status == "DEFICIT"


def test_compute_earmarking_status_critical_lapse():
    status = compute_earmarking_status(sc_pct=3.0, st_pct=1.0)
    assert status == "CRITICAL_LAPSE"


def test_compute_compliance_grade():
    # Compliant on SC (>=15%), ST (>=7.5%), UC rate >= 80%
    assert compute_compliance_grade(sc_pct=16.0, st_pct=8.5, uc_rate=90.0) == "A"
    # Minor shortfall, UC >= 75%
    assert compute_compliance_grade(sc_pct=13.0, st_pct=6.0, uc_rate=80.0) == "B"
    # Deficit
    assert compute_compliance_grade(sc_pct=10.0, st_pct=4.0, uc_rate=60.0) == "C"
    # Critical lapse
    assert compute_compliance_grade(sc_pct=5.0, st_pct=2.0, uc_rate=45.0) == "D"
    # Prohibited violation
    assert compute_compliance_grade(sc_pct=16.0, st_pct=8.5, uc_rate=90.0, neg_count=1) == "F"
