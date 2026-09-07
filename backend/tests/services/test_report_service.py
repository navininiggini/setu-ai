"""Unit and integration tests for Phase 3: Sovereign PDF Document Assembler (report_service.py)."""

import pytest
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.services.report_service import (
    generate_role_specific_audit_pdf,
    generate_audit_pdf,
    generate_works_csv,
)
from app.main import app

PDF_MAGIC = b"%PDF-"


@pytest.fixture(scope="module")
def db_session():
    """Provides a database session for test execution."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    """Provides FastAPI TestClient."""
    return TestClient(app)


def test_generate_ministry_pdf(db_session):
    """Verify MoSPI National Parliamentary Audit Dossier generation."""
    pdf_bytes = generate_role_specific_audit_pdf(
        db=db_session,
        role="ministry",
        jurisdiction="National"
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(PDF_MAGIC), "File must begin with valid PDF signature"
    assert len(pdf_bytes) > 40000, f"Sovereign PDF with charts must be >40KB, got {len(pdf_bytes)} bytes"
    assert b"/Type /Page" in pdf_bytes, "PDF must contain page dictionary structures"


def test_generate_state_pdf(db_session):
    """Verify State Nodal Authority (SNA) Statewide Vigilance Brief generation."""
    pdf_bytes = generate_role_specific_audit_pdf(
        db=db_session,
        role="state",
        jurisdiction="Bihar"
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(PDF_MAGIC)
    assert len(pdf_bytes) > 40000, f"State PDF with charts must be >40KB, got {len(pdf_bytes)} bytes"


def test_generate_district_pdf(db_session):
    """Verify District Magistrate Pre-Sanction Structuring Audit generation."""
    pdf_bytes = generate_role_specific_audit_pdf(
        db=db_session,
        role="district",
        jurisdiction="Darbhanga"
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(PDF_MAGIC)
    assert len(pdf_bytes) > 40000, f"District PDF with charts must be >40KB, got {len(pdf_bytes)} bytes"


def test_generate_mp_pdf(db_session):
    """Verify Member of Parliament Constituency Asset Delivery Scorecard generation."""
    pdf_bytes = generate_role_specific_audit_pdf(
        db=db_session,
        role="mp",
        jurisdiction="Gopal Jee Thakur"
    )
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(PDF_MAGIC)
    assert len(pdf_bytes) > 40000, f"MP Scorecard with charts must be >40KB, got {len(pdf_bytes)} bytes"


def test_legacy_generate_audit_pdf_wrapper(db_session):
    """Verify legacy wrapper maintains backward compatibility."""
    pdf_bytes = generate_audit_pdf(db=db_session, state=None, jurisdiction="National")
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(PDF_MAGIC)
    assert len(pdf_bytes) > 40000


def test_generate_works_csv(db_session):
    """Verify raw CSV data export maintains expected structure."""
    csv_data = generate_works_csv(db=db_session, min_risk=60.0)
    assert isinstance(csv_data, str)
    assert "Work ID,MP Name,Work Description" in csv_data
    lines = csv_data.strip().split("\n")
    assert len(lines) > 5, "Should return at least several high-risk works"


@pytest.mark.parametrize("role,jurisdiction,expected_snippet", [
    ("ministry", "National", "National_PAC_Audit"),
    ("state", "Bihar", "Statewide_Vigilance_Brief"),
    ("district", "Darbhanga", "DM_PreSanction"),
    ("mp", "Gopal Jee Thakur", "MP_Constituency"),
])
def test_api_reports_audit_pdf_endpoints(client, role, jurisdiction, expected_snippet):
    """Verify FastAPI GET /api/reports/audit-pdf across all 4 governance tiers."""
    response = client.get(f"/api/reports/audit-pdf?role={role}&jurisdiction={jurisdiction}")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "Content-Disposition" in response.headers
    assert expected_snippet in response.headers["Content-Disposition"]
    assert response.content.startswith(PDF_MAGIC)
    assert len(response.content) > 40000


def test_build_curated_works_docket_rag_tags():
    """Verify that _build_curated_works_docket renders [Mitigated] and [Confirmed] tags based on eval_result."""
    from unittest.mock import MagicMock
    from app.services.report_service import _build_curated_works_docket, _get_sovereign_styles

    st = _get_sovereign_styles()

    w1 = MagicMock()
    w1.id = "WORK-001"
    w1.state = "Bihar"
    w1.constituency = "Darbhanga"
    w1.city = "Darbhanga"
    w1.ida = "District Rural Development Agency (DRDA)"
    w1.allocation_amount = 450000.0
    w1.risk_score = 78.0
    w1.predicted_fraud_type = "Vendor Capture"
    w1.risk_reasons = ["100% agency concentration"]

    w2 = MagicMock()
    w2.id = "WORK-002"
    w2.state = "Bihar"
    w2.constituency = "Patna"
    w2.city = "Patna"
    w2.ida = "ABC Private Infratech"
    w2.allocation_amount = 495000.0
    w2.risk_score = 82.0
    w2.predicted_fraud_type = "Structuring"
    w2.risk_reasons = ["Split contract below 5L"]

    mock_eval = {
        "evaluated_works": [
            {
                "id": "WORK-001",
                "is_hard_negative": True,
                "mitigations": ["Implementing agency is District Rural Development Agency (Statutory Public Body)."],
                "confirmed_flags": []
            },
            {
                "id": "WORK-002",
                "is_hard_negative": False,
                "mitigations": [],
                "confirmed_flags": ["Private entity contract awarded just below Rs. 5.0L GFR 161 threshold."]
            }
        ]
    }

    table = _build_curated_works_docket([w1, w2], st, role="ministry", eval_result=mock_eval)
    assert table is not None
    # Verify table row count (1 header title + 1 column header + 2 works)
    assert len(table._cellvalues) == 4
    # Check row 2 (w1): should contain [Mitigated]
    w1_cell = str(table._cellvalues[2][3].text)
    assert "Mitigated" in w1_cell
    # Check row 3 (w2): should contain [Confirmed]
    w2_cell = str(table._cellvalues[3][3].text)
    assert "Confirmed" in w2_cell

