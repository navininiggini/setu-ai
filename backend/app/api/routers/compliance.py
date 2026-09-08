"""
SETU — Statutory Compliance Auditing Router
Provides REST endpoints for statutory monitoring:
- SC/ST Earmarking Compliance (Para 2.5)
- Utilization Certificate (UC) Compliance (Para 4.6 & GFR 238)
- Prohibited Works Negative List (Annexure-III)
- Trust/Society Expenditure Ceiling Monitor (Para 3.14)
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.compliance_service import compliance_service

router = APIRouter(prefix="/compliance", tags=["Statutory Compliance"])

@router.get("/summary")
def get_national_compliance_summary(db: Session = Depends(get_db)):
    """National overview of MPLADS statutory compliance metrics."""
    return compliance_service.get_national_compliance_summary(db)


@router.get("/earmarking")
def get_compliance_leaderboard(
    status: Optional[str] = Query(None, description="Filter by status: COMPLIANT, DEFICIT, CRITICAL_LAPSE"),
    grade: Optional[str] = Query(None, description="Filter by grade: A, B, C, D, F"),
    sort_by: str = Query("sc_pct", description="Sort by: sc_pct, st_pct, uc_rate, allocation, works, grade, name"),
    order: str = Query("desc", description="asc or desc"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Paginated list of MPs with statutory earmarking, UC rate, and compliance grade."""
    return compliance_service.get_mp_compliance_leaderboard(
        db=db,
        status_filter=status,
        grade_filter=grade,
        sort_by=sort_by,
        order=order,
        limit=limit,
        offset=offset
    )


@router.get("/earmarking/{mp_name}")
def get_mp_earmarking_detail(mp_name: str, db: Session = Depends(get_db)):
    """Detailed statutory compliance analysis for an individual MP."""
    res = compliance_service.compute_mp_earmarking(db, mp_name)
    if not res or res.get("total_works", 0) == 0:
        raise HTTPException(status_code=404, detail=f"No works or records found for MP '{mp_name}'")
    return res


@router.get("/negative-list-violations")
def get_negative_list_violations(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List of works flagged for violating the statutory Negative List (Annexure-III)."""
    return compliance_service.get_negative_list_violations(db=db, limit=limit, offset=offset)


@router.get("/trust-society-ceiling")
def get_trust_society_ceiling(db: Session = Depends(get_db)):
    """Monitor MP expenditures against the statutory ₹50.0 Lakhs per FY ceiling for Trusts/Societies."""
    return compliance_service.get_trust_society_report(db)
