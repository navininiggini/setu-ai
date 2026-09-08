from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import oauth2_scheme, decode_access_token
from app.models.work import Work
from app.models.decision_support import DecisionSupport
from app.schemas.work import WorkFilterParams, PaginatedWorksResponse, WorkResponse
from app.services.work_service import get_works_paginated, get_work_detail, get_filter_options

router = APIRouter(prefix="/works", tags=["Works"])

@router.get("", response_model=PaginatedWorksResponse)
def list_works(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    category: Optional[str] = None,
    state: Optional[str] = None,
    constituency: Optional[str] = None,
    mp_name: Optional[str] = None,
    ida: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    min_risk_score: Optional[float] = None,
    max_risk_score: Optional[float] = None,
    fraud_type: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "risk_score",
    sort_order: Optional[str] = "desc",
    beneficiary_type: Optional[str] = None,
    uc_status: Optional[str] = None,
    negative_list_only: Optional[bool] = None,
    earmarked_only: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    params = WorkFilterParams(
        page=page,
        limit=limit,
        category=category,
        state=state,
        constituency=constituency,
        mp_name=mp_name,
        ida=ida,
        status=status,
        risk_level=risk_level,
        min_risk_score=min_risk_score,
        max_risk_score=max_risk_score,
        fraud_type=fraud_type,
        search=search,
        sort_by=sort_by or "risk_score",
        sort_order=sort_order or "desc",
        beneficiary_type=beneficiary_type,
        uc_status=uc_status,
        negative_list_only=negative_list_only,
        earmarked_only=earmarked_only,
    )
    return get_works_paginated(db=db, params=params)

@router.get("/filters")
def get_filters(db: Session = Depends(get_db)):
    return get_filter_options(db=db)

@router.get("/{work_id}")
def get_work(work_id: str, db: Session = Depends(get_db)):
    work = get_work_detail(db=db, work_id=work_id)
    if not work:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work with ID {work_id} not found"
        )
    return work


@router.get("/{work_id}/decision-support")
def get_work_decision_support(
    work_id: str,
    role: Optional[str] = Query(None, description="Requesting role: ministry, state, district, or mp"),
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Retrieve grounded role-scoped decision support recommendations for a work.

    Returns tailored recommendations for the requesting role (ministry sees all four roles).
    If no decision support entry exists (e.g. Low risk work), returns not_applicable status.
    """
    from app.models.decision_support import DecisionSupport
    from app.core.security import decode_access_token

    # Resolve requesting role from token or query param (defaulting to ministry if unspecified)
    effective_role = "ministry"
    if token:
        payload = decode_access_token(token)
        if payload and "role" in payload:
            effective_role = str(payload["role"]).lower()
    if role:
        effective_role = role.lower()

    # Find work
    work = db.query(Work).filter(Work.id == work_id).first()
    if not work:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Work {work_id} not found"
        )

    # Check for stored decision support row
    ds = db.query(DecisionSupport).filter(DecisionSupport.work_id == work_id).first()
    if not ds:
        # If work is Low risk or not yet generated, return graceful not_applicable
        return {
            "work_id": work_id,
            "status": "not_applicable",
            "role": effective_role,
            "message": "Routine monitoring; no elevated anomaly triggers warranting decision support.",
            "recommendations": [] if effective_role != "ministry" else {"mp": [], "district": [], "state": [], "ministry": []},
            "triggered_domains": [],
            "source": None,
            "confidence_note": None,
            "generated_at": None,
        }

    raw_recs = ds.recommendations or {}
    # Scope recommendations according to role
    if effective_role == "ministry":
        scoped_recs = raw_recs
    else:
        scoped_recs = raw_recs.get(effective_role, [])

    return {
        "work_id": work_id,
        "status": "available",
        "role": effective_role,
        "source": ds.source,
        "confidence_note": ds.confidence_note,
        "triggered_domains": ds.triggered_domains or [],
        "recommendations": scoped_recs,
        "all_recommendations": raw_recs if effective_role == "ministry" else None,
        "generated_at": ds.generated_at.isoformat() if ds.generated_at else None,
    }
