"""Pydantic Schemas for SETU Risk Intelligence API.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class LiveFusionRequest(BaseModel):
    project_id: str = Field(default="PROPOSAL-NEW-01", description="Project or proposal identifier")
    financial_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    geospatial_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    procurement_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    contractor_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    payment_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    progress_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    graph_anomaly_score: float = Field(default=0.0, ge=0.0, le=100.0)
    fraud_probability: float = Field(default=0.0, ge=0.0, le=1.0)
    predicted_typology: str = Field(default="NORMAL")
    domain_reasons: Optional[Dict[str, List[str]]] = None


class LiveFusionResponse(BaseModel):
    project_id: str
    overall_risk_score: float
    risk_level: str
    investigation_priority: str
    primary_typology: str
    fraud_probability: float
    synthesized_reasons: List[str]
    primary_reason: str
    secondary_reason: Optional[str] = None
    tertiary_reason: Optional[str] = None


class RawProposalScoringRequest(BaseModel):
    project_id: Optional[str] = Field(default=None, description="Optional proposal identifier")
    work_name: str = Field(default="Construction of Community Center", description="Proposed work title")
    category: str = Field(default="Public Infrastructure", description="MPLADS project sector category")
    state: str = Field(default="Bihar", description="State name")
    constituency: str = Field(default="Darbhanga", description="Constituency name")
    district: Optional[str] = Field(default="DARBHANGA", description="District name")
    ida: Optional[str] = Field(default="District Planning Authority", description="Implementing Agency")
    contractor_name: Optional[str] = Field(default="Apex Infrastructure Ltd", description="Proposed contractor")
    sanctioned_amount: float = Field(default=2500000.0, ge=0.0, description="Requested fund amount in INR")
    estimated_cost: Optional[float] = Field(default=None, ge=0.0, description="Technical cost estimate in INR")
    tender_amount: Optional[float] = Field(default=None, ge=0.0, description="Tender contract value in INR")
    planned_duration_days: int = Field(default=180, ge=1, le=3650, description="Planned timeline duration in days")
    work_type: Optional[str] = Field(default="Civil Infrastructure", description="Specific work typology")
    num_bidders: Optional[int] = Field(default=3, ge=1, description="Number of tender participants")
    is_single_bid: Optional[bool] = Field(default=False, description="Whether single-bid tender occurred")
    contractor_past_delays: Optional[int] = Field(default=0, ge=0, description="Prior delayed projects by contractor")
    latitude: Optional[float] = Field(default=26.1542, description="Project location latitude")
    longitude: Optional[float] = Field(default=85.8918, description="Project location longitude")

    @model_validator(mode="before")
    @classmethod
    def sanitize_inputs(cls, values: Any) -> Any:
        if isinstance(values, dict):
            cleaned = dict(values)
            # Coerce empty strings to None for optional/numeric attributes
            for k, v in list(cleaned.items()):
                if v == "":
                    cleaned[k] = None

            # String field fallbacks
            if not cleaned.get("work_name"):
                cleaned["work_name"] = "Proposed Infrastructure Project"
            if not cleaned.get("category"):
                cleaned["category"] = "Public Infrastructure"
            if not cleaned.get("state"):
                cleaned["state"] = "Bihar"
            if not cleaned.get("constituency"):
                cleaned["constituency"] = "Darbhanga"

            # Numeric sanitization & clamping
            if cleaned.get("sanctioned_amount") is None:
                cleaned["sanctioned_amount"] = 2500000.0
            else:
                try:
                    cleaned["sanctioned_amount"] = max(0.0, float(cleaned["sanctioned_amount"]))
                except (ValueError, TypeError):
                    cleaned["sanctioned_amount"] = 2500000.0

            if cleaned.get("estimated_cost") is not None:
                try:
                    cleaned["estimated_cost"] = max(0.0, float(cleaned["estimated_cost"]))
                except (ValueError, TypeError):
                    cleaned["estimated_cost"] = None

            if cleaned.get("tender_amount") is not None:
                try:
                    cleaned["tender_amount"] = max(0.0, float(cleaned["tender_amount"]))
                except (ValueError, TypeError):
                    cleaned["tender_amount"] = None

            if cleaned.get("planned_duration_days") is None:
                cleaned["planned_duration_days"] = 180
            else:
                try:
                    val = int(cleaned["planned_duration_days"])
                    cleaned["planned_duration_days"] = max(1, min(3650, val))
                except (ValueError, TypeError):
                    cleaned["planned_duration_days"] = 180

            if cleaned.get("num_bidders") is not None:
                try:
                    cleaned["num_bidders"] = max(1, int(cleaned["num_bidders"]))
                except (ValueError, TypeError):
                    cleaned["num_bidders"] = 3

            if cleaned.get("contractor_past_delays") is not None:
                try:
                    cleaned["contractor_past_delays"] = max(0, int(cleaned["contractor_past_delays"]))
                except (ValueError, TypeError):
                    cleaned["contractor_past_delays"] = 0

            if cleaned.get("latitude") is not None:
                try:
                    cleaned["latitude"] = float(cleaned["latitude"])
                except (ValueError, TypeError):
                    cleaned["latitude"] = 26.1542

            if cleaned.get("longitude") is not None:
                try:
                    cleaned["longitude"] = float(cleaned["longitude"])
                except (ValueError, TypeError):
                    cleaned["longitude"] = 85.8918

            return cleaned
        return values


class RawProposalScoringResponse(BaseModel):
    proposal_id: str
    overall_risk_score: float
    risk_level: str
    investigation_priority: str
    primary_typology: str
    fraud_probability: float
    approval_recommendation: str
    sub_scores: Dict[str, float]
    synthesized_reasons: List[str]
    primary_reason: str
    secondary_reason: Optional[str] = None
    inference_time_ms: float
    evaluated_at: str


class ProjectRiskDetailResponse(BaseModel):
    project_id: str
    overall_risk_score: float
    risk_level: str
    investigation_priority: str
    primary_typology: str
    fraud_probability: float
    synthesized_reasons: List[str]
    primary_reason: str
    secondary_reason: Optional[str] = None
    tertiary_reason: Optional[str] = None
    domain_scores: Dict[str, float]
    feature_importance_contributions: Optional[Dict[str, float]] = None
    scored_at: str


class RiskIntelligenceSummaryResponse(BaseModel):
    total_projects_evaluated: int
    risk_tier_distribution: Dict[str, int]
    investigation_priority_distribution: Dict[str, int]
    typology_distribution: Dict[str, int]
    risk_score_statistics: Dict[str, float]
    generated_at: str
