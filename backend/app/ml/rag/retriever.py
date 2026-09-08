"""Contextual RAG Retriever for Real-World MPLADS Audit Grounding.

Queries the RAG Knowledge Base to fetch statutory rules, regional flood/calamity
status, election blackout windows, agency classifications, and SoR unit benchmarks.
"""

import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

from app.ml.rag.knowledge_base import RAGKnowledgeBase


class RAGRetriever:
    """Retrieves operational, statutory, and environmental ground-truth context."""

    def __init__(self, kb: Optional[RAGKnowledgeBase] = None):
        self.kb = kb or RAGKnowledgeBase()

    def get_statutory_rules(self, typology: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves statutory rules matching a detected anomaly typology."""
        typology_lower = (typology or "").lower()
        rules = []

        if "splitting" in typology_lower or "structuring" in typology_lower or "smurfing" in typology_lower:
            rules.append(self.kb.STATUTORY_RULES["GFR_RULE_155"])
            rules.append(self.kb.STATUTORY_RULES["GFR_RULE_161"])
        elif "single" in typology_lower or "monopoly" in typology_lower or "cartel" in typology_lower:
            rules.append(self.kb.STATUTORY_RULES["GFR_RULE_173"])
            rules.append(self.kb.STATUTORY_RULES["GFR_RULE_149"])
        elif "delay" in typology_lower or "progress" in typology_lower or "milestone" in typology_lower:
            rules.append(self.kb.STATUTORY_RULES["MPLADS_2023_CALAMITY"])
        
        if "earmark" in typology_lower or "sc" in typology_lower or "st" in typology_lower or "deficit" in typology_lower:
            rules.append(self.kb.STATUTORY_RULES["MPLADS_2023_SC_ST_MANDATE"])
        if "uc" in typology_lower or "utilization" in typology_lower or "overdue" in typology_lower:
            rules.append(self.kb.STATUTORY_RULES["MPLADS_2023_UC_COMPLIANCE"])
        if "negative" in typology_lower or "prohibited" in typology_lower or "trust" in typology_lower or "society" in typology_lower:
            rules.append(self.kb.STATUTORY_RULES["MPLADS_2023_NEGATIVE_LIST"])

        # Always include primary overarching guidelines
        if self.kb.STATUTORY_RULES["MPLADS_2023_ELIGIBILITY"] not in rules:
            rules.append(self.kb.STATUTORY_RULES["MPLADS_2023_ELIGIBILITY"])

        return rules

    def is_flood_calamity_zone(self, jurisdiction: str) -> bool:
        """Determines if a district or constituency falls in a recognized flood/calamity zone."""
        if not jurisdiction:
            return False
        clean_jur = jurisdiction.lower().strip()
        return any(district in clean_jur or clean_jur in district for district in self.kb.FLOOD_PRONE_DISTRICTS)

    def is_in_monsoon_window(self, date_str: Optional[str]) -> bool:
        """Checks if a given date string falls inside the statutory monsoon/flood moratorium."""
        if not date_str:
            return False
        try:
            # Handle common date formats (YYYY-MM-DD or DD-MM-YYYY)
            dt = None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
                try:
                    dt = datetime.strptime(date_str.strip()[:10], fmt)
                    break
                except ValueError:
                    continue
            if not dt:
                return False

            month = dt.month
            day = dt.day
            # June 15 to October 15
            if month in (7, 8, 9):
                return True
            if month == 6 and day >= 15:
                return True
            if month == 10 and day <= 15:
                return True
            return False
        except Exception:
            return False

    def is_in_election_blackout(self, date_str: Optional[str]) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """Checks if a given date falls within a statutory Election Model Code of Conduct window."""
        if not date_str:
            return False, None
        try:
            dt = None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
                try:
                    dt = datetime.strptime(date_str.strip()[:10], fmt)
                    break
                except ValueError:
                    continue
            if not dt:
                return False, None

            d_str = dt.strftime("%Y-%m-%d")
            for window in self.kb.ELECTION_MCC_WINDOWS:
                if window["start_date"] <= d_str <= window["end_date"]:
                    return True, window
            return False, None
        except Exception:
            return False, None

    def classify_agency(self, agency_name: Optional[str]) -> Dict[str, Any]:
        """Classifies executing agency into Statutory Public Body vs. Private Tendered Contractor."""
        if not agency_name:
            return {
                "type": "UNKNOWN",
                "is_statutory_public_body": False,
                "description": "Unspecified implementing entity"
            }

        clean_name = agency_name.lower().strip()
        for key, desc in self.kb.STATUTORY_PUBLIC_AGENCIES.items():
            if key in clean_name:
                return {
                    "type": "STATUTORY_GOVERNMENT_AGENCY",
                    "is_statutory_public_body": True,
                    "matched_agency": key.upper(),
                    "description": desc,
                    "regulatory_note": (
                        "Constitutional line department or state PSU. 100% allocation concentration represents "
                        "statutory administrative designation by the Collectorate, not private contractor cartelization."
                    )
                }

        return {
            "type": "TENDERED_PRIVATE_ENTITY",
            "is_statutory_public_body": False,
            "description": "Private contractor or external executing agency requiring open competitive procurement audit."
        }

    def match_sor_benchmark(self, work_desc: Optional[str], amount: float) -> Optional[Dict[str, Any]]:
        """Checks if a work matches standard Schedule of Rates single-unit community asset costs."""
        if not work_desc or amount <= 0:
            return None

        desc_lower = work_desc.lower()
        for benchmark_key, benchmark in self.kb.SOR_BENCHMARKS.items():
            # Check keywords
            if any(kw in desc_lower for kw in benchmark["keywords"]):
                # Check amount range
                if benchmark["standard_cost_min"] <= amount <= benchmark["standard_cost_max"]:
                    return {
                        "benchmark_category": benchmark_key,
                        "sor_code": benchmark["sor_code"],
                        "typical_units": benchmark["typical_units"],
                        "verdict": benchmark["verdict"],
                        "is_mitigated_sor_unit": True
                    }

        return None

    def retrieve_context(
        self,
        role: str,
        jurisdiction: str,
        metrics: Dict[str, Any],
        sample_works: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Compiles exhaustive real-world context for a report request.
        Cross-references jurisdiction against flood/calamity records, election blackout,
        agency mandates, and standard SoR unit costs.
        """
        top_typology = metrics.get("top_typology", "")
        statutory_rules = self.get_statutory_rules(top_typology)
        is_flood_zone = self.is_flood_calamity_zone(jurisdiction)

        analyzed_works = []
        mitigation_factors = []
        confirmed_findings = []

        if is_flood_zone:
            mitigation_factors.append(
                f"Jurisdiction '{jurisdiction}' is recognized as an active riverine flood/waterlogging zone. "
                f"Monsoon season earthwork moratorium (June 15 – October 15) legally halts civil execution."
            )

        if sample_works:
            for w in sample_works:
                w_id = w.get("id", "WORK")
                w_desc = w.get("work") or w.get("description") or w.get("title", "")
                w_amt = float(w.get("allocation_amount") or 0.0)
                w_date = w.get("recommended_date") or w.get("sanction_date") or w.get("created_at") or ""
                w_ida = w.get("ida") or w.get("implementing_agency") or ""
                w_risk = float(w.get("risk_score") or 0.0)

                agency_info = self.classify_agency(w_ida)
                sor_match = self.match_sor_benchmark(w_desc, w_amt)
                is_mcc, mcc_window = self.is_in_election_blackout(str(w_date))
                is_monsoon = self.is_in_monsoon_window(str(w_date))

                work_mitigations = []
                work_confirmed_flags = []

                if agency_info["is_statutory_public_body"]:
                    work_mitigations.append(f"Implementing agency is {agency_info['description']} (Statutory Public Body).")

                if is_mcc and mcc_window:
                    work_mitigations.append(
                        f"Work date ({w_date}) fell inside the 2024 Lok Sabha Model Code of Conduct blackout "
                        f"({mcc_window['start_date']} to {mcc_window['end_date']}), during which disbursements were frozen by statutory mandate."
                    )

                if is_monsoon and is_flood_zone:
                    work_mitigations.append(
                        f"Work date fell during the regional monsoon flood moratorium (June 15 – Oct 15) in {jurisdiction}."
                    )

                if sor_match and sor_match["is_mitigated_sor_unit"]:
                    work_mitigations.append(
                        f"Allocation of Rs. {w_amt:,.0f} matches standard {sor_match['sor_code']} ({sor_match['typical_units']}). Not contract splitting."
                    )

                if not agency_info["is_statutory_public_body"] and w_amt >= 450000.0 and w_amt < 500000.0 and not sor_match:
                    work_confirmed_flags.append(
                        f"Private entity contract awarded at Rs. {w_amt:,.0f} just below the Rs. 5.0L GFR 161 threshold without SoR unit justification."
                    )

                if w_risk >= 75.0 and len(work_mitigations) == 0:
                    work_confirmed_flags.append(
                        f"High risk score ({w_risk:.1f}) with zero operational, calamity, or statutory agency mitigating factors."
                    )

                analyzed_works.append({
                    "id": w_id,
                    "description": w_desc,
                    "allocation": w_amt,
                    "agency_classification": agency_info,
                    "mitigations": work_mitigations,
                    "confirmed_flags": work_confirmed_flags,
                    "is_hard_negative": bool(len(work_mitigations) > 0 and len(work_confirmed_flags) == 0)
                })

        return {
            "jurisdiction": jurisdiction,
            "role": role,
            "is_flood_calamity_zone": is_flood_zone,
            "statutory_rules": [r["title"] + ": " + r["statutory_mandate"] for r in statutory_rules],
            "general_mitigations": mitigation_factors,
            "analyzed_sample_works": analyzed_works
        }
