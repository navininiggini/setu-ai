from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SummaryCards(BaseModel):
    total_works: int
    total_allocation: float
    flagged_works_count: int
    amount_at_risk: float
    avg_risk_score: float
    critical_cases_count: int
    resolved_cases_count: int
    active_alerts_count: int

class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    critical: int

class FraudTypeBreakdownItem(BaseModel):
    fraud_type: str
    label: str
    count: int
    total_amount: float
    percentage: float

class GeoRiskSummaryItem(BaseModel):
    name: str  # state name or district name
    code: Optional[str] = None
    total_works: int
    total_allocation: float
    avg_risk_score: float
    flagged_works_count: int
    amount_at_risk: float
    risk_level: str

class TopFlaggedWorkItem(BaseModel):
    id: str
    work: str
    mp_name: str
    ida: str
    state: str
    constituency: str
    allocation_amount: float
    status: str
    risk_score: float
    risk_level: str
    predicted_fraud_type: Optional[str] = None
    risk_reasons: List[str] = []
    sub_scores: Dict[str, Any] = {}
    fraud_probability: Optional[float] = None

class MonthlyTrendItem(BaseModel):
    month: str
    total_sanctions: float
    flagged_amount: float
    flagged_count: int

class DashboardResponse(BaseModel):
    role: str
    jurisdiction: str
    summary: SummaryCards
    risk_distribution: RiskDistribution
    fraud_breakdown: List[FraudTypeBreakdownItem]
    geo_breakdown: List[GeoRiskSummaryItem]
    top_flagged_works: List[TopFlaggedWorkItem]
    recent_alerts: List[Dict[str, Any]]
    monthly_trends: List[MonthlyTrendItem]
    extra_insights: Dict[str, Any] = {}
