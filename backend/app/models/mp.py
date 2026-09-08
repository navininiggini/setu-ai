from sqlalchemy import Column, String, Float, Integer, JSON, Boolean
from app.core.database import Base

class MP(Base):
    __tablename__ = "mps"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    state = Column(String(100), index=True)
    constituency = Column(String(255), index=True)
    house = Column(String(50), default="Lok Sabha")
    total_works = Column(Integer, default=0)
    total_allocation = Column(Float, default=0.0)
    avg_risk_score = Column(Float, default=0.0)
    flagged_works_count = Column(Integer, default=0)
    top_work_categories = Column(JSON, default=list)
    top_idas = Column(JSON, default=list)

    # --- Statutory Compliance Fields (MPLADS Guidelines 2023) ---
    # SC/ST Earmarking Compliance (Para 2.5)
    sc_allocation_amount = Column(Float, default=0.0)
    st_allocation_amount = Column(Float, default=0.0)
    sc_allocation_pct = Column(Float, default=0.0)  # Target: >= 15.0%
    st_allocation_pct = Column(Float, default=0.0)  # Target: >= 7.5%
    earmarking_status = Column(String(30), default="COMPLIANT")  # COMPLIANT | DEFICIT | CRITICAL_LAPSE

    # Trust & Society Ceiling (₹50L per FY)
    trust_society_spend = Column(Float, default=0.0)
    trust_society_ceiling_breach = Column(Boolean, default=False)

    # Utilization Certificate Compliance
    uc_compliance_rate = Column(Float, default=100.0)  # % of works with UC submitted on time
    uc_overdue_count = Column(Integer, default=0)

    # Overall statutory compliance grade
    statutory_compliance_grade = Column(String(20), default="A")  # A | B | C | D | F
