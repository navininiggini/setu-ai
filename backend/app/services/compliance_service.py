"""
SETU — MPLADS Statutory Compliance Auditing Service
Deterministic Statutory Compliance Engine (MoSPI MPLADS Guidelines 2023, GFR 2017)

Enforces:
1. SC/ST Earmarking Mandate (Para 2.5): 15% SC, 7.5% ST of annual entitlement
2. Utilization Certificate (UC) Compliance (Para 4.6 & GFR 238): 30-day deadline
3. Negative List / Prohibited Works (Annexure-III)
4. Trust/Society ₹50.0 Lakhs per MP FY Ceiling (Para 3.14)
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from app.models.work import Work
from app.models.mp import MP
from app.models.constituency import Constituency
from app.ml.features.earmark_classifier import compute_earmarking_status, compute_compliance_grade

class ComplianceService:
    """Deterministic statutory compliance auditing engine."""

    @staticmethod
    def get_national_compliance_summary(db: Session) -> Dict[str, Any]:
        """Aggregates statutory compliance metrics nationwide across all MPs and works."""
        total_mps = db.query(MP).count()
        if total_mps == 0:
            return {
                "total_mps": 0,
                "compliant_mps": 0,
                "deficit_mps": 0,
                "critical_lapse_mps": 0,
                "compliance_rate_pct": 0.0,
                "avg_sc_pct": 0.0,
                "avg_st_pct": 0.0,
                "target_sc_pct": 15.0,
                "target_st_pct": 7.5,
                "target_combined_pct": 22.5,
                "national_uc_compliance_rate": 0.0,
                "total_completed_works": 0,
                "total_uc_overdue_works": 0,
                "negative_list_violations_count": 0,
                "trust_society_breaches_count": 0,
                "total_sc_allocation": 0.0,
                "total_st_allocation": 0.0,
                "total_allocation": 0.0
            }

        mps = db.query(MP).all()
        compliant_count = sum(1 for m in mps if (m.earmarking_status or "").upper() == "COMPLIANT")
        deficit_count = sum(1 for m in mps if (m.earmarking_status or "").upper() == "DEFICIT")
        critical_count = sum(1 for m in mps if (m.earmarking_status or "").upper() == "CRITICAL_LAPSE")
        
        # In case earmarking_status was default
        if compliant_count == 0 and deficit_count == 0 and critical_count == 0:
            for m in mps:
                sc = m.sc_allocation_pct or 0.0
                st = m.st_allocation_pct or 0.0
                status = compute_earmarking_status(sc, st)
                if status == "COMPLIANT":
                    compliant_count += 1
                elif status == "DEFICIT":
                    deficit_count += 1
                else:
                    critical_count += 1

        total_alloc = sum(m.total_allocation or 0.0 for m in mps)
        total_sc = sum(m.sc_allocation_amount or 0.0 for m in mps)
        total_st = sum(m.st_allocation_amount or 0.0 for m in mps)

        avg_sc_pct = round(sum(m.sc_allocation_pct or 0.0 for m in mps) / total_mps, 2)
        avg_st_pct = round(sum(m.st_allocation_pct or 0.0 for m in mps) / total_mps, 2)

        # UC statistics from works
        total_completed = db.query(Work).filter(Work.status.ilike("%completed%")).count()
        total_uc_submitted = db.query(Work).filter(
            Work.status.ilike("%completed%"),
            Work.uc_status.in_(["SUBMITTED", "VERIFIED"])
        ).count()
        total_uc_overdue = db.query(Work).filter(Work.uc_status == "OVERDUE").count()

        national_uc_rate = round((total_uc_submitted / total_completed * 100.0) if total_completed > 0 else 100.0, 1)

        # Negative list violations count
        neg_count = db.query(Work).filter(Work.is_negative_list_violation == True).count()

        # Trust / Society ceiling breaches
        trust_breaches = sum(1 for m in mps if bool(m.trust_society_ceiling_breach))

        return {
            "total_mps": total_mps,
            "compliant_mps": compliant_count,
            "deficit_mps": deficit_count,
            "critical_lapse_mps": critical_count,
            "compliance_rate_pct": round((compliant_count / total_mps * 100.0), 1),
            "avg_sc_pct": avg_sc_pct,
            "avg_st_pct": avg_st_pct,
            "target_sc_pct": 15.0,
            "target_st_pct": 7.5,
            "target_combined_pct": 22.5,
            "national_uc_compliance_rate": national_uc_rate,
            "total_completed_works": total_completed,
            "total_uc_submitted_works": total_uc_submitted,
            "total_uc_overdue_works": total_uc_overdue,
            "negative_list_violations_count": neg_count,
            "trust_society_breaches_count": trust_breaches,
            "total_sc_allocation": round(total_sc, 2),
            "total_st_allocation": round(total_st, 2),
            "total_allocation": round(total_alloc, 2)
        }

    @staticmethod
    def compute_mp_earmarking(db: Session, mp_name: str) -> Dict[str, Any]:
        """Returns comprehensive statutory compliance breakdown for a single MP."""
        mp = db.query(MP).filter(MP.name.ilike(mp_name)).first()
        works = db.query(Work).filter(Work.mp_name.ilike(mp_name)).all()

        total_works = len(works)
        total_alloc = sum(w.allocation_amount or 0.0 for w in works)
        
        sc_works = [w for w in works if w.is_sc_earmarked or w.beneficiary_type == "SC_HABITATION"]
        st_works = [w for w in works if w.is_st_earmarked or w.beneficiary_type == "ST_HABITATION"]
        gen_works = [w for w in works if w.beneficiary_type == "GENERAL" and not w.is_sc_earmarked and not w.is_st_earmarked]

        sc_alloc = sum(w.allocation_amount or 0.0 for w in sc_works)
        st_alloc = sum(w.allocation_amount or 0.0 for w in st_works)
        gen_alloc = sum(w.allocation_amount or 0.0 for w in gen_works)

        sc_pct = round((sc_alloc / total_alloc * 100.0) if total_alloc > 0 else 0.0, 1)
        st_pct = round((st_alloc / total_alloc * 100.0) if total_alloc > 0 else 0.0, 1)

        status = compute_earmarking_status(sc_pct, st_pct)
        target_sc_amt = total_alloc * 0.15
        target_st_amt = total_alloc * 0.075

        sc_shortfall = max(0.0, round(target_sc_amt - sc_alloc, 2))
        st_shortfall = max(0.0, round(target_st_amt - st_alloc, 2))

        # UC stats
        completed_works = [w for w in works if "completed" in (w.status or "").lower()]
        uc_submitted = [w for w in completed_works if w.uc_status in ("SUBMITTED", "VERIFIED")]
        uc_overdue = [w for w in works if w.uc_status == "OVERDUE"]
        uc_rate = round((len(uc_submitted) / len(completed_works) * 100.0) if completed_works else 100.0, 1)

        # Negative list
        neg_works = [w for w in works if bool(w.is_negative_list_violation)]

        # Trust/Society
        trust_works = [w for w in works if bool(w.is_trust_society_work)]
        trust_spend = sum(w.allocation_amount or 0.0 for w in trust_works)
        trust_breach = trust_spend > 5000000.0  # ₹50L ceiling

        grade = compute_compliance_grade(sc_pct, st_pct, uc_rate, len(neg_works))

        return {
            "mp_name": mp_name,
            "constituency": mp.constituency if mp else (works[0].constituency if works else "Unknown"),
            "state": mp.state if mp else (works[0].state if works else "Unknown"),
            "house": mp.house if mp else "Lok Sabha",
            "statutory_compliance_grade": grade,
            "earmarking_status": status,
            "total_allocation": round(total_alloc, 2),
            "total_works": total_works,
            "sc_allocation_amount": round(sc_alloc, 2),
            "st_allocation_amount": round(st_alloc, 2),
            "general_allocation_amount": round(gen_alloc, 2),
            "sc_allocation_pct": sc_pct,
            "st_allocation_pct": st_pct,
            "target_sc_pct": 15.0,
            "target_st_pct": 7.5,
            "target_combined_pct": 22.5,
            "sc_shortfall_amount": sc_shortfall,
            "st_shortfall_amount": st_shortfall,
            "sc_works_count": len(sc_works),
            "st_works_count": len(st_works),
            "general_works_count": len(gen_works),
            "uc_compliance_rate": uc_rate,
            "completed_works_count": len(completed_works),
            "uc_submitted_count": len(uc_submitted),
            "uc_overdue_count": len(uc_overdue),
            "negative_list_violations_count": len(neg_works),
            "negative_list_works": [
                {
                    "id": w.id,
                    "work": w.work,
                    "category": w.category,
                    "allocation_amount": w.allocation_amount,
                    "reason": w.negative_list_reason
                }
                for w in neg_works[:5]
            ],
            "trust_society_spend": round(trust_spend, 2),
            "trust_society_ceiling": 5000000.0,
            "trust_society_ceiling_breach": trust_breach
        }

    @staticmethod
    def get_mp_compliance_leaderboard(
        db: Session,
        status_filter: Optional[str] = None,
        grade_filter: Optional[str] = None,
        sort_by: str = "sc_pct",
        order: str = "desc",
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Returns paginated list of MPs with full statutory compliance indicators."""
        query = db.query(MP)

        if status_filter:
            query = query.filter(MP.earmarking_status.ilike(status_filter))
        if grade_filter:
            query = query.filter(MP.statutory_compliance_grade.ilike(grade_filter))

        total = query.count()

        # Sorting
        sort_map = {
            "sc_pct": MP.sc_allocation_pct,
            "st_pct": MP.st_allocation_pct,
            "uc_rate": MP.uc_compliance_rate,
            "allocation": MP.total_allocation,
            "works": MP.total_works,
            "grade": MP.statutory_compliance_grade,
            "name": MP.name
        }
        col = sort_map.get(sort_by, MP.sc_allocation_pct)
        if order == "desc":
            query = query.order_by(desc(col))
        else:
            query = query.order_by(asc(col))

        mps = query.offset(offset).limit(limit).all()

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "id": m.id,
                    "name": m.name,
                    "state": m.state,
                    "constituency": m.constituency,
                    "house": m.house,
                    "total_works": m.total_works,
                    "total_allocation": m.total_allocation,
                    "sc_allocation_amount": m.sc_allocation_amount,
                    "st_allocation_amount": m.st_allocation_amount,
                    "sc_allocation_pct": m.sc_allocation_pct,
                    "st_allocation_pct": m.st_allocation_pct,
                    "earmarking_status": m.earmarking_status,
                    "uc_compliance_rate": m.uc_compliance_rate,
                    "uc_overdue_count": m.uc_overdue_count,
                    "trust_society_spend": m.trust_society_spend,
                    "trust_society_ceiling_breach": m.trust_society_ceiling_breach,
                    "statutory_compliance_grade": m.statutory_compliance_grade
                }
                for m in mps
            ]
        }

    @staticmethod
    def get_negative_list_violations(
        db: Session,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Returns paginated list of works violating the statutory negative list."""
        query = db.query(Work).filter(Work.is_negative_list_violation == True)
        total = query.count()
        works = query.order_by(desc(Work.allocation_amount)).offset(offset).limit(limit).all()

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "items": [
                {
                    "id": w.id,
                    "mp_name": w.mp_name,
                    "work": w.work,
                    "category": w.category,
                    "state": w.state,
                    "constituency": w.constituency,
                    "allocation_amount": w.allocation_amount,
                    "status": w.status,
                    "negative_list_reason": w.negative_list_reason,
                    "compliance_score": w.compliance_score,
                    "compliance_flags": w.compliance_flags
                }
                for w in works
            ]
        }

    @staticmethod
    def get_trust_society_report(db: Session) -> Dict[str, Any]:
        """Monitors compliance with the ₹50.0 Lakhs per MP FY Trust/Society ceiling."""
        breached_mps = db.query(MP).filter(MP.trust_society_ceiling_breach == True).all()
        approaching_mps = db.query(MP).filter(
            MP.trust_society_spend >= 3500000.0,
            MP.trust_society_spend <= 5000000.0
        ).all()

        return {
            "statutory_ceiling": 5000000.0,
            "statutory_rule": "MPLADS Guidelines 2023, Para 3.14 (Max ₹50.0L per MP per FY for registered Societies/Trusts)",
            "total_breached": len(breached_mps),
            "total_approaching": len(approaching_mps),
            "breached_mps": [
                {
                    "name": m.name,
                    "state": m.state,
                    "constituency": m.constituency,
                    "trust_society_spend": m.trust_society_spend,
                    "excess_amount": round(m.trust_society_spend - 5000000.0, 2)
                }
                for m in breached_mps
            ],
            "approaching_mps": [
                {
                    "name": m.name,
                    "state": m.state,
                    "constituency": m.constituency,
                    "trust_society_spend": m.trust_society_spend,
                    "remaining_limit": round(5000000.0 - m.trust_society_spend, 2)
                }
                for m in approaching_mps
            ]
        }

compliance_service = ComplianceService()
