"""Unit and integration tests for ComplianceService.

Verifies MoSPI MPLADS 2023 statutory auditing computations against the database.
"""

import pytest
from app.core.database import SessionLocal
from app.services.compliance_service import ComplianceService


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    yield db
    db.close()


def test_get_national_compliance_summary(db_session):
    summary = ComplianceService.get_national_compliance_summary(db_session)
    assert "total_mps" in summary
    assert summary["total_mps"] > 0
    assert "target_sc_pct" in summary
    assert summary["target_sc_pct"] == 15.0
    assert summary["target_st_pct"] == 7.5
    assert summary["target_combined_pct"] == 22.5
    assert "national_uc_compliance_rate" in summary
    assert "total_completed_works" in summary
    assert "total_uc_overdue_works" in summary


def test_get_mp_compliance_leaderboard(db_session):
    leaderboard = ComplianceService.get_mp_compliance_leaderboard(
        db_session,
        limit=10,
        offset=0,
    )
    assert "total" in leaderboard
    assert leaderboard["total"] > 0
    assert len(leaderboard["items"]) <= 10
    item = leaderboard["items"][0]
    assert "name" in item
    assert "sc_allocation_pct" in item
    assert "st_allocation_pct" in item
    assert "statutory_compliance_grade" in item


def test_compute_mp_earmarking(db_session):
    leaderboard = ComplianceService.get_mp_compliance_leaderboard(db_session, limit=1)
    if leaderboard["items"]:
        mp_name = leaderboard["items"][0]["name"]
        detail = ComplianceService.compute_mp_earmarking(db_session, mp_name=mp_name)
        assert detail is not None
        assert detail["mp_name"] == mp_name
        assert "target_sc_pct" in detail
        assert "sc_shortfall_amount" in detail
        assert "st_shortfall_amount" in detail


def test_get_negative_list_violations(db_session):
    res = ComplianceService.get_negative_list_violations(db_session)
    assert "total" in res
    assert "items" in res
    assert isinstance(res["items"], list)


def test_get_trust_society_report(db_session):
    report = ComplianceService.get_trust_society_report(db_session)
    assert "statutory_ceiling" in report
    assert "total_breached" in report
    assert "total_approaching" in report
    assert "breached_mps" in report
