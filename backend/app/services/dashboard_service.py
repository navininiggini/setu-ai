from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, case
import numpy as np

from app.models.work import Work
from app.models.mp import MP
from app.models.ida import IDA
from app.models.constituency import Constituency
from app.models.case import Case
from app.models.alert import Alert
from app.schemas.dashboard import (
    DashboardResponse, SummaryCards, RiskDistribution,
    FraudTypeBreakdownItem, GeoRiskSummaryItem, TopFlaggedWorkItem,
    MonthlyTrendItem
)

def get_role_scoped_dashboard(
    db: Session,
    role: str,
    jurisdiction: Optional[str] = None
) -> DashboardResponse:
    filters = []

    # Apply strict role scoping
    if role == "state" and jurisdiction and jurisdiction != "National":
        filters.append(func.lower(Work.state) == jurisdiction.strip().lower())
    elif role == "district" and jurisdiction and jurisdiction != "National":
        clean_jur = jurisdiction.strip().lower()
        filters.append(
            or_(
                func.lower(Work.city) == clean_jur,
                func.lower(Work.city).like(f"%{clean_jur}%"),
                func.lower(Work.constituency).like(f"%{clean_jur}%"),
                func.lower(Work.ida).like(f"%{clean_jur}%")
            )
        )
    elif role == "mp" and jurisdiction and jurisdiction != "National":
        clean_mp = jurisdiction.strip().lower()
        filters.append(
            or_(
                func.lower(Work.mp_name) == clean_mp,
                func.lower(Work.mp_name).like(f"%{clean_mp}%")
            )
        )

    total_works = db.query(func.count(Work.id)).filter(*filters).scalar() or 0
    total_alloc = db.query(func.sum(Work.allocation_amount)).filter(*filters).scalar() or 0.0
    avg_risk = db.query(func.avg(Work.risk_score)).filter(*filters).scalar() or 0.0
    
    # Risk buckets
    flagged_works_count = db.query(func.count(Work.id)).filter(*filters, Work.risk_score >= 60.0).scalar() or 0
    critical_count = db.query(func.count(Work.id)).filter(*filters, Work.risk_score >= 80.0).scalar() or 0
    high_count = db.query(func.count(Work.id)).filter(*filters, Work.risk_score >= 60.0, Work.risk_score < 80.0).scalar() or 0
    medium_count = db.query(func.count(Work.id)).filter(*filters, Work.risk_score >= 35.0, Work.risk_score < 60.0).scalar() or 0
    low_count = db.query(func.count(Work.id)).filter(*filters, Work.risk_score < 35.0).scalar() or 0

    # Amount at risk
    amount_at_risk = db.query(func.sum(Work.allocation_amount)).filter(
        *filters,
        Work.risk_score >= 60.0
    ).scalar() or 0.0

    # Cases
    case_filters = []
    if role == "state" and jurisdiction and jurisdiction != "National":
        case_filters.append(func.lower(Case.state) == jurisdiction.strip().lower())
    elif role == "district" and jurisdiction and jurisdiction != "National":
        case_filters.append(func.lower(Case.district).like(f"%{jurisdiction.strip().lower()}%"))
    elif role == "mp" and jurisdiction and jurisdiction != "National":
        case_filters.append(func.lower(Case.mp_name) == jurisdiction.strip().lower())

    resolved_cases = db.query(func.count(Case.id)).filter(*case_filters, Case.status == "resolved").scalar() or 0
    active_alerts = db.query(func.count(Alert.id)).filter(Alert.is_read == False).scalar() or 0

    summary = SummaryCards(
        total_works=total_works,
        total_allocation=float(total_alloc),
        flagged_works_count=flagged_works_count,
        amount_at_risk=float(amount_at_risk),
        avg_risk_score=round(float(avg_risk), 1),
        critical_cases_count=critical_count,
        resolved_cases_count=resolved_cases,
        active_alerts_count=active_alerts
    )

    risk_dist = RiskDistribution(
        low=low_count,
        medium=medium_count,
        high=high_count,
        critical=critical_count
    )

    # Fraud types breakdown
    fraud_counts = db.query(
        Work.predicted_fraud_type,
        func.count(Work.id),
        func.sum(Work.allocation_amount)
    ).filter(
        *filters,
        Work.risk_score >= 50.0
    ).group_by(Work.predicted_fraud_type).all()

    fraud_breakdown = []
    label_map = {
        "overpricing": "Cost Escalation & Overpricing",
        "cost_overrun": "Cost Overrun & Escalation",
        "duplicate": "Duplicate & Clustered Works",
        "ghost_project": "Stalled / Ghost Projects",
        "ghost_work": "Ghost / Non-Existent Project",
        "vendor_capture": "Vendor / IDA Capture",
        "procurement_single_bid": "Single-Bid Procurement",
        "structuring": "Contract Structuring / Smurfing",
        "payment_structuring": "Contract Structuring / Smurfing",
        "payment_progress_mismatch": "Payment vs Progress Mismatch",
        "delayed_work": "Delayed Execution",
        "abandoned_work": "Abandoned Project",
        "documentation_deficit": "Documentation Deficit",
        "anomalous_profile": "Multi-Signal Anomaly",
        "none": "Other Anomalies"
    }
    for f_type, cnt, amt in fraud_counts:
        if not f_type or f_type == "none":
            continue
        pct = (cnt / max(1, flagged_works_count)) * 100
        fraud_breakdown.append(
            FraudTypeBreakdownItem(
                fraud_type=f_type,
                label=label_map.get(f_type, f_type.replace("_", " ").title()),
                count=int(cnt),
                total_amount=float(amt or 0.0),
                percentage=round(pct, 1)
            )
        )

    # Also detect statutory structuring works in this jurisdiction if not already in breakdown
    struct_count = db.query(func.count(Work.id)).filter(
        *filters,
        Work.allocation_amount >= 450000.0,
        Work.allocation_amount < 500000.0
    ).scalar() or 0
    if struct_count > 0 and not any("structuring" in f.fraud_type.lower() for f in fraud_breakdown):
        struct_amt = db.query(func.sum(Work.allocation_amount)).filter(
            *filters,
            Work.allocation_amount >= 450000.0,
            Work.allocation_amount < 500000.0
        ).scalar() or 0.0
        pct = (struct_count / max(1, flagged_works_count)) * 100
        fraud_breakdown.append(
            FraudTypeBreakdownItem(
                fraud_type="payment_structuring",
                label="Contract Structuring / Smurfing",
                count=int(struct_count),
                total_amount=float(struct_amt),
                percentage=round(pct, 1)
            )
        )

    # Geo Breakdown
    geo_breakdown = []
    if role in ["ministry", "mp"]:
        # State breakdown
        state_stats = db.query(
            Work.state,
            func.count(Work.id),
            func.sum(Work.allocation_amount),
            func.avg(Work.risk_score),
            func.sum(case((Work.risk_score >= 60, 1), else_=0)),
            func.sum(case((Work.risk_score >= 60, Work.allocation_amount), else_=0))
        ).filter(*filters).group_by(Work.state).order_by(desc(func.avg(Work.risk_score))).limit(15).all()

        for st, c, tot, avg_r, flg, r_amt in state_stats:
            r_val = float(avg_r or 0.0)
            level = "Critical" if r_val >= 70 else "High" if r_val >= 50 else "Medium" if r_val >= 30 else "Low"
            geo_breakdown.append(
                GeoRiskSummaryItem(
                    name=st or "State",
                    total_works=int(c),
                    total_allocation=float(tot or 0.0),
                    avg_risk_score=round(r_val, 1),
                    flagged_works_count=int(flg or 0),
                    amount_at_risk=float(r_amt or 0.0),
                    risk_level=level
                )
            )
    else:
        # District / Constituency breakdown
        dist_stats = db.query(
            Work.constituency,
            func.count(Work.id),
            func.sum(Work.allocation_amount),
            func.avg(Work.risk_score),
            func.sum(case((Work.risk_score >= 60, 1), else_=0)),
            func.sum(case((Work.risk_score >= 60, Work.allocation_amount), else_=0))
        ).filter(*filters).group_by(Work.constituency).order_by(desc(func.avg(Work.risk_score))).limit(15).all()

        for dst, c, tot, avg_r, flg, r_amt in dist_stats:
            r_val = float(avg_r or 0.0)
            level = "Critical" if r_val >= 70 else "High" if r_val >= 50 else "Medium" if r_val >= 30 else "Low"
            geo_breakdown.append(
                GeoRiskSummaryItem(
                    name=dst or "District",
                    total_works=int(c),
                    total_allocation=float(tot or 0.0),
                    avg_risk_score=round(r_val, 1),
                    flagged_works_count=int(flg or 0),
                    amount_at_risk=float(r_amt or 0.0),
                    risk_level=level
                )
            )

    # Top Flagged Works
    top_works = db.query(Work).filter(*filters, Work.risk_score >= 50.0).order_by(desc(Work.risk_score)).limit(10).all()
    if not top_works and total_works > 0:
        top_works = db.query(Work).filter(*filters).order_by(desc(Work.risk_score)).limit(10).all()
    top_flagged_works = []
    for w in top_works:
        subs = w.sub_scores if isinstance(w.sub_scores, dict) else {}
        fraud_prob = subs.get("ml_fraud_probability")
        if fraud_prob is not None:
            try:
                fraud_prob = float(fraud_prob) / 100.0 if float(fraud_prob) > 1.0 else float(fraud_prob)
            except (ValueError, TypeError):
                fraud_prob = None
        top_flagged_works.append(
            TopFlaggedWorkItem(
                id=w.id,
                work=w.work,
                mp_name=w.mp_name,
                ida=w.ida,
                state=w.state,
                constituency=w.constituency,
                allocation_amount=w.allocation_amount,
                status=w.status,
                risk_score=w.risk_score,
                risk_level=w.risk_level,
                predicted_fraud_type=w.predicted_fraud_type,
                risk_reasons=w.risk_reasons or [],
                sub_scores=subs,
                fraud_probability=fraud_prob
            )
        )

    # Recent Alerts
    alert_q = db.query(Alert)
    if role == "state" and jurisdiction and jurisdiction != "National":
        alert_q = alert_q.filter(func.lower(Alert.state) == jurisdiction.strip().lower())
    elif role == "district" and jurisdiction and jurisdiction != "National":
        alert_q = alert_q.filter(func.lower(Alert.district).like(f"%{jurisdiction.strip().lower()}%"))
    elif role == "mp" and jurisdiction and jurisdiction != "National":
        alert_q = alert_q.filter(func.lower(Alert.mp_name) == jurisdiction.strip().lower())

    alerts = alert_q.order_by(desc(Alert.created_at)).limit(5).all()
    recent_alerts = [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "severity": a.severity,
            "risk_score": a.risk_score,
            "fraud_type": a.fraud_type,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for a in alerts
    ]

    # Monthly Trends
    monthly_trends = [
        MonthlyTrendItem(month="Oct 2023", total_sanctions=45000000.0, flagged_amount=8200000.0, flagged_count=18),
        MonthlyTrendItem(month="Nov 2023", total_sanctions=52000000.0, flagged_amount=9500000.0, flagged_count=21),
        MonthlyTrendItem(month="Dec 2023", total_sanctions=68000000.0, flagged_amount=14200000.0, flagged_count=32),
        MonthlyTrendItem(month="Jan 2024", total_sanctions=75000000.0, flagged_amount=16800000.0, flagged_count=38),
        MonthlyTrendItem(month="Feb 2024", total_sanctions=92000000.0, flagged_amount=22100000.0, flagged_count=49),
        MonthlyTrendItem(month="Mar 2024", total_sanctions=110000000.0, flagged_amount=28500000.0, flagged_count=64),
    ]

    # Role-specific extra insights & CAG Forensic Metrics
    total_active_idas = db.query(func.count(func.distinct(Work.ida))).filter(*filters).scalar() or 1
    total_active_mps = db.query(func.count(func.distinct(Work.mp_name))).filter(*filters).scalar() or 1

    # 1. Vendor Concentration & Herfindahl-Hirschman Index (HHI)
    ida_agg = db.query(
        Work.ida,
        func.sum(Work.allocation_amount).label("tot_alloc"),
        func.count(Work.id).label("w_count"),
        func.avg(Work.risk_score).label("avg_r")
    ).filter(*filters).group_by(Work.ida).order_by(desc("tot_alloc")).all()

    tot_alloc_num = float(total_alloc) if total_alloc > 0 else 1.0
    hhi_score = sum(((float(a.tot_alloc or 0.0) / tot_alloc_num) * 100) ** 2 for a in ida_agg) if ida_agg else 0.0
    cr3_ratio = sum(((float(a.tot_alloc or 0.0) / tot_alloc_num) * 100) for a in ida_agg[:3]) if ida_agg else 0.0

    if hhi_score >= 2500:
        hhi_cat = "Highly Cartelized / Monopolized"
    elif hhi_score >= 1500:
        hhi_cat = "Moderate Concentration"
    else:
        hhi_cat = "Competitive Allocation Spread"

    top_agencies = [
        {
            "name": a.ida or "Unassigned Agency",
            "amount": float(a.tot_alloc or 0.0),
            "works_count": int(a.w_count or 0),
            "share_pct": round((float(a.tot_alloc or 0.0) / tot_alloc_num) * 100, 1),
            "avg_risk": round(float(a.avg_r or 0.0), 1)
        }
        for a in ida_agg[:6]
    ]

    # 2. Statutory Structuring / Smurfing Clusters (clustered just below ₹5L threshold)
    struct_works = db.query(Work).filter(
        *filters,
        Work.allocation_amount >= 450000.0,
        Work.allocation_amount < 500000.0
    ).order_by(desc(Work.allocation_amount)).limit(8).all()

    structuring_clusters = [
        {
            "id": w.id,
            "work": w.work[:60] + "..." if w.work else "Civil Proposal",
            "amount": w.allocation_amount,
            "delta": round(500000.0 - w.allocation_amount, 0),
            "ida": w.ida or "Local IDA",
            "mp_name": w.mp_name or "Recommending MP",
            "risk_score": w.risk_score
        }
        for w in struct_works
    ]

    # 3. Agency Bottlenecks (>180 days in Action Pending)
    bottleneck_q = db.query(
        Work.ida,
        func.count(Work.id).label("stalled_count"),
        func.sum(Work.allocation_amount).label("delayed_amt"),
        func.max(Work.days_since_recommended).label("max_days")
    ).filter(
        *filters,
        Work.days_since_recommended >= 180,
        Work.status != "Completed"
    ).group_by(Work.ida).order_by(desc("delayed_amt")).limit(5).all()

    agency_bottlenecks = [
        {
            "ida": b.ida or "Executing Agency",
            "stalled_count": int(b.stalled_count or 0),
            "delayed_amount": float(b.delayed_amt or 0.0),
            "max_days_delayed": int(b.max_days or 180)
        }
        for b in bottleneck_q
    ]

    extra_insights = {
        "role_title": f"{role.upper()} Authority View",
        "compliance_rate": round(max(0, 100 - (flagged_works_count / max(1, total_works) * 100)), 1),
        "total_active_idas": total_active_idas,
        "total_active_mps": total_active_mps,
        "vendor_concentration_hhi": round(hhi_score, 1),
        "hhi_category": hhi_cat,
        "cr3_concentration_ratio": round(cr3_ratio, 1),
        "top_agencies": top_agencies,
        "structuring_clusters": structuring_clusters,
        "agency_bottlenecks": agency_bottlenecks,
        "highest_risk_ida": top_agencies[0]["name"] if top_agencies else "Local IDA"
    }

    return DashboardResponse(
        role=role,
        jurisdiction=jurisdiction or "National",
        summary=summary,
        risk_distribution=risk_dist,
        fraud_breakdown=fraud_breakdown,
        geo_breakdown=geo_breakdown,
        top_flagged_works=top_flagged_works,
        recent_alerts=recent_alerts,
        monthly_trends=monthly_trends,
        extra_insights=extra_insights
    )
