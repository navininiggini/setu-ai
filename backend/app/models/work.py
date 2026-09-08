from sqlalchemy import Column, String, Float, Integer, Boolean, Text, DateTime, JSON
from datetime import datetime
from app.core.database import Base

class Work(Base):
    __tablename__ = "works"

    id = Column(String(64), primary_key=True, index=True)
    mp_name = Column(String(255), index=True)
    work = Column(Text)
    category = Column(String(255), default="Normal/Others")
    state = Column(String(100), index=True)
    constituency = Column(String(255), index=True)
    ida = Column(String(255), index=True)
    city = Column(String(255), nullable=True)
    ward = Column(String(255), nullable=True)
    block = Column(String(255), nullable=True)
    village = Column(String(255), nullable=True)
    recommended_date = Column(String(50), nullable=True, index=True)
    allocation_amount = Column(Float, default=0.0, index=True)
    ida_approval = Column(String(100), default="Action Pending")
    status = Column(String(100), default="Unsanctioned", index=True)
    house = Column(String(50), default="Lok Sabha")
    
    # Feature columns from dataset
    state_mean_alloc = Column(Float, nullable=True)
    state_std_alloc = Column(Float, nullable=True)
    alloc_zscore_state = Column(Float, nullable=True)
    work_type = Column(String(255), nullable=True, index=True)
    worktype_mean_alloc = Column(Float, nullable=True)
    worktype_std_alloc = Column(Float, nullable=True)
    alloc_zscore_worktype = Column(Float, nullable=True)
    duplicate_count = Column(Integer, default=1)
    is_duplicate_candidate = Column(Boolean, default=False)
    ida_work_count = Column(Integer, default=1)
    mp_total_works = Column(Integer, default=1)
    mp_total_allocation = Column(Float, default=0.0)

    # ML Anomaly & Risk fields
    risk_score = Column(Float, default=0.0, index=True)
    risk_level = Column(String(20), default="Low", index=True)  # Low, Medium, High, Critical
    risk_reasons = Column(JSON, default=list)  # list of explainable reason strings
    sub_scores = Column(JSON, default=dict)  # breakdown of individual model signals
    predicted_fraud_type = Column(String(50), nullable=True)  # overpricing, duplicate, ghost_project, vendor_capture, structuring, none
    days_since_recommended = Column(Integer, default=0)

    # --- Statutory Compliance Fields (MPLADS Guidelines 2023) ---
    beneficiary_type = Column(String(30), default="GENERAL", index=True)  # GENERAL | SC_HABITATION | ST_HABITATION
    is_sc_earmarked = Column(Boolean, default=False, index=True)
    is_st_earmarked = Column(Boolean, default=False, index=True)

    # Utilization Certificate tracking
    uc_status = Column(String(30), default="PENDING", index=True)  # PENDING | SUBMITTED | OVERDUE | VERIFIED
    uc_submitted_date = Column(String(50), nullable=True)
    uc_overdue_days = Column(Integer, default=0)

    # Negative list / prohibited works enforcement
    is_negative_list_violation = Column(Boolean, default=False, index=True)
    negative_list_reason = Column(String(255), nullable=True)

    # Trust/Society ceiling tracker
    is_trust_society_work = Column(Boolean, default=False)

    # Compliance risk signals (separate from ML fraud risk)
    compliance_flags = Column(JSON, default=list)  # List of statutory compliance violations
    compliance_score = Column(Float, default=100.0)  # 100 = fully compliant, 0 = severe non-compliance

    created_at = Column(DateTime, default=datetime.utcnow)
