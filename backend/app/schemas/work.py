from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class WorkBase(BaseModel):
    id: str
    mp_name: str
    work: str
    category: Optional[str] = "Normal/Others"
    state: str
    constituency: str
    ida: str
    city: Optional[str] = None
    ward: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    recommended_date: Optional[str] = None
    allocation_amount: float
    ida_approval: Optional[str] = "Action Pending"
    status: Optional[str] = "Unsanctioned"
    house: Optional[str] = "Lok Sabha"
    
    # Features
    state_mean_alloc: Optional[float] = None
    alloc_zscore_state: Optional[float] = None
    work_type: Optional[str] = None
    alloc_zscore_worktype: Optional[float] = None
    duplicate_count: Optional[int] = 1
    is_duplicate_candidate: Optional[bool] = False
    ida_work_count: Optional[int] = 1
    mp_total_works: Optional[int] = 1
    mp_total_allocation: Optional[float] = 0.0

    # Risk fields
    risk_score: float = 0.0
    risk_level: str = "Low"
    risk_reasons: List[str] = []
    sub_scores: Dict[str, Any] = {}
    predicted_fraud_type: Optional[str] = None
    days_since_recommended: Optional[int] = 0

    # Statutory Compliance fields
    beneficiary_type: Optional[str] = "GENERAL"
    is_sc_earmarked: Optional[bool] = False
    is_st_earmarked: Optional[bool] = False
    uc_status: Optional[str] = "PENDING"
    uc_submitted_date: Optional[str] = None
    uc_overdue_days: Optional[int] = 0
    is_negative_list_violation: Optional[bool] = False
    negative_list_reason: Optional[str] = None
    is_trust_society_work: Optional[bool] = False
    compliance_flags: Optional[List[str]] = []
    compliance_score: Optional[float] = 100.0

class WorkCreate(WorkBase):
    pass

class WorkResponse(WorkBase):
    model_config = ConfigDict(from_attributes=True)

class WorkFilterParams(BaseModel):
    page: int = 1
    limit: int = 50
    category: Optional[str] = None
    state: Optional[str] = None
    constituency: Optional[str] = None
    mp_name: Optional[str] = None
    ida: Optional[str] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    min_risk_score: Optional[float] = None
    max_risk_score: Optional[float] = None
    fraud_type: Optional[str] = None
    search: Optional[str] = None
    sort_by: Optional[str] = "risk_score"
    sort_order: Optional[str] = "desc"
    beneficiary_type: Optional[str] = None
    uc_status: Optional[str] = None
    negative_list_only: Optional[bool] = None
    earmarked_only: Optional[bool] = None

class PaginatedWorksResponse(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    items: List[WorkResponse]
