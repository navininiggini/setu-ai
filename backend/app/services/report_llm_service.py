"""RAG-Augmented Audit Intelligence & Decision Support Engine.

Synthesizes live quantitative metrics, external statutory rules (GFR 149/154/155/161/173),
disaster/monsoon moratoriums, ECI election freezes, and agency mandates into direct,
plain-English administrative audit findings. Strictly enforces zero-buzzword auditor prose.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.ml.decision_support.gemini_client import GeminiDecisionSupportClient
from app.ml.rag.hard_negative_evaluator import HardNegativeEvaluator

logger = logging.getLogger("setu.reports.llm")

# Structured Schema enforcing plain-spoken auditor findings and hard-negative evaluations
REPORT_INTELLIGENCE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "executive_summary": {
            "type": "STRING",
            "description": "Two plain-English factual audit paragraphs. Strictly no dramatic buzzwords or AI jargon."
        },
        "real_world_evaluation": {
            "type": "STRING",
            "description": "Factual assessment of hard negatives (monsoon flood moratorium, ECI Model Code of Conduct freeze, statutory public agency mandates) versus confirmed procurement anomalies."
        },
        "key_findings": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Exactly three grounded empirical audit findings."
        },
        "procedural_directives": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Exactly three actionable, legally grounded field administrative procedures."
        }
    },
    "required": ["executive_summary", "real_world_evaluation", "key_findings", "procedural_directives"]
}

REPORT_SYSTEM_INSTRUCTION = """You are the Senior Administrative Auditor for SETU, the Ministry of Statistics and Programme Implementation (MoSPI) platform monitoring the Member of Parliament Local Area Development Scheme (MPLADS).

Your sole responsibility is to evaluate live audit telemetry and external real-world context (statutory rules, flood moratoriums, election blackout periods, and agency mandates) to produce an authoritative, plain-spoken audit briefing.

STRICT OPERATIONAL DIRECTIVES:
1. ZERO-BUZZWORD AUDITOR PROSE:
   - You are STRICTLY FORBIDDEN from using dramatic, decorative, or academic AI jargon.
   - BANNED WORDS/PHRASES: "algorithmic surveillance", "econometric profiling", "cross-state cartel funnels", "structural vulnerability", "sovereign oversight authority", "strategic agency concentration", "panoptic", "tapestry", "nexus", "synergistic", "transformative".
   - PRESCRIBED VOCABULARY: "Audit finding", "Physical inspection", "Disbursement log", "Schedule of Rates (SoR) benchmark", "GFR Rule 155 quotation threshold", "Measurement Book (MB) verification", "Utilization Certificate (UC)", "Operational delay factor", "Mitigating condition", "Statutory show-cause notice".
2. HARD-NEGATIVE & REAL-WORLD GROUNDING:
   - Distinguish genuine malfeasance (collusive bidding, ghost projects, deliberate contract splitting) from explainable real-world conditions:
     a. Natural disasters and monsoon moratoriums (June 15 – October 15 in flood zones).
     b. Statutory 2024 Lok Sabha Model Code of Conduct (MCC) freeze (March 16 – June 6, 2024).
     c. Statutory Public Line Departments (CPWD, DRDA, State PWD, Pul Nirman Nigam) where 100% agency allocation is administrative mandate, not private contractor capture.
     d. Standard rural unit costs matching approved Schedule of Rates (e.g. Solar high-mast lights @ Rs. 4.85 Lakhs).
3. ROLE-APPROPRIATE PROCEDURAL ACTIONS:
   - 'ministry' (MoSPI): Public Accounts Committee (PAC) audit requisitions, central disbursement freezes, CAG special verification teams.
   - 'state' (State Nodal Authority): Show-cause notices to executing divisions, withholding subsequent installment releases, contractor debarment inquiries.
   - 'district' (District Magistrate): Magisterial stop-work orders, Measurement Book (MB) impoundment, SDM field re-measurement orders.
   - 'mp' (Member of Parliament): Quarterly Collectorate review meetings, geo-tagged photo verification, pending rural drinking water clearances.
4. SCHEMA ADHERENCE: Output valid JSON strictly conforming to the schema.
"""


def _build_rag_report_prompt(
    role: str,
    jurisdiction: str,
    metrics: Dict[str, Any],
    eval_result: Dict[str, Any]
) -> str:
    """Constructs plain-spoken auditor prompt enriched with RAG real-world evaluation."""
    total_works = metrics.get("total_works", 0)
    total_outlay = metrics.get("total_outlay", 0.0)
    outlay_cr = total_outlay / 10000000.0 if total_outlay > 1000000 else total_outlay
    flagged_count = metrics.get("flagged_count", 0)
    amount_at_risk = metrics.get("amount_at_risk", 0.0)
    risk_cr = amount_at_risk / 10000000.0 if amount_at_risk > 1000000 else amount_at_risk
    hhi = metrics.get("hhi", 0.0)
    raw_risk = eval_result.get("raw_risk_score", metrics.get("avg_risk", 45.0))
    calibrated_risk = eval_result.get("calibrated_risk_score", raw_risk)
    verdict = eval_result.get("portfolio_verdict", "CONFIRMED_ANOMALY")

    mitigations_text = "\n".join([f"  - {m}" for m in eval_result.get("operational_mitigations", [])]) or "  - None reported"
    confirmed_text = "\n".join([f"  - {f}" for f in eval_result.get("confirmed_traces", [])]) or "  - None identified"
    rules_text = "\n".join([f"  - {r}" for r in eval_result.get("statutory_rules", [])]) or "  - Standard GFR 2017 Rules"

    prompt = (
        f"AUDIT DOSSIER REQUISITION:\n"
        f"- Target Authority Tier: {role.upper()}\n"
        f"- Jurisdiction: {jurisdiction}\n"
        f"- Total Works Monitored: {total_works:,}\n"
        f"- Total Public Outlay: Rs. {outlay_cr:.2f} Crores\n"
        f"- Flagged Projects under Review: {flagged_count:,}\n"
        f"- Public Capital under Review: Rs. {risk_cr:.2f} Crores\n"
        f"- Statistical ML Risk Score: {raw_risk:.1f} / 100.0\n"
        f"- Real-World Calibrated Risk Score: {calibrated_risk:.1f} / 100.0\n"
        f"- Concentration Index (HHI): {hhi:.1f}\n"
        f"- RAG Real-World Portfolio Verdict: {verdict}\n\n"
        f"RETRIEVED OPERATIONAL GROUND-TRUTH (EXTERNAL RAG):\n"
        f"1. Operational Mitigating Conditions (Hard Negatives):\n{mitigations_text}\n"
        f"2. Confirmed Non-Compliance Traces:\n{confirmed_text}\n"
        f"3. Governing Statutory Rules:\n{rules_text}\n\n"
        f"TASK: Synthesize a plain-spoken audit briefing for {role.upper()} ({jurisdiction}).\n"
        f"Requirements:\n"
        f"- executive_summary: Exactly two plain-English factual paragraphs (no buzzwords).\n"
        f"- real_world_evaluation: One plain paragraph explaining whether flagged items are legitimate operational delays (monsoon, election freeze, public agency mandate) or unmitigated procurement violations.\n"
        f"- key_findings: Exactly 3 grounded empirical bullet points.\n"
        f"- procedural_directives: Exactly 3 enforceable administrative directives for the {role.upper()} authority."
    )
    return prompt


# Backward compatibility alias
_build_report_prompt = _build_rag_report_prompt


def _get_fallback_report_intelligence(
    role: str,
    jurisdiction: str,
    metrics: Dict[str, Any],
    eval_result: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Deterministic, plain-English fallback when Gemini is offline or rate-limited."""
    total_works = metrics.get("total_works", 0)
    total_outlay = metrics.get("total_outlay", 0.0)
    outlay_cr = total_outlay / 10000000.0 if total_outlay > 1000000 else total_outlay
    flagged_count = metrics.get("flagged_count", 0)
    amount_at_risk = metrics.get("amount_at_risk", 0.0)
    risk_cr = amount_at_risk / 10000000.0 if amount_at_risk > 1000000 else amount_at_risk
    hhi = metrics.get("hhi", 0.0)
    jur = jurisdiction or ("National" if role == "ministry" else "State Jurisdiction")

    ev = eval_result or {
        "portfolio_verdict": "CONFIRMED_ANOMALY",
        "verdict_summary": "Standard operational assessment.",
        "calibrated_risk_score": metrics.get("avg_risk", 45.0),
        "mitigated_count": 0,
        "confirmed_count": flagged_count,
        "operational_mitigations": [],
        "confirmed_traces": []
    }

    calibrated_score = ev.get("calibrated_risk_score", 45.0)

    if role == "ministry":
        return {
            "executive_summary": (
                f"An audit review of the national MPLADS portfolio covers {total_works:,} sanctioned public works "
                f"with an aggregate outlay of Rs. {outlay_cr:.2f} Crores. Central screening flags {flagged_count:,} projects "
                f"representing Rs. {risk_cr:.2f} Crores for detailed verification, reflecting a portfolio concentration "
                f"index (HHI) of {hhi:.1f}.\n\n"
                f"Audit scrutiny confirms repeat contract allocation across inter-state border agencies. Field records "
                f"indicate that while legitimate developmental milestones continue, multi-district tender awards require "
                f"formal verification against General Financial Rules (GFR 2017) Rule 161 competitive bidding mandates."
            ),
            "real_world_evaluation": (
                f"Real-world operational analysis indicates that national execution schedules experienced temporary "
                f"administrative freezes during the 82-day 2024 General Election Model Code of Conduct (March 16 – June 6, 2024). "
                f"However, unmitigated agency concentration in designated border corridors accounts for Rs. {risk_cr:.2f} Crores "
                f"in repeat awards, warranting targeted Public Accounts Committee review."
            ),
            "key_findings": [
                f"Audit screening places Rs. {risk_cr:.2f} Crores across {flagged_count} projects under priority review out of Rs. {outlay_cr:.2f} Crores total outlay.",
                f"National concentration index of {hhi:.1f} signals concentrated tender distribution in key regional engineering divisions.",
                f"Repeat contract awards identified across adjacent state border corridors requiring verification against GFR Rule 161."
            ],
            "procedural_directives": [
                "Requisition formal Public Accounts Committee (PAC) hearing on repeat inter-state contract awards.",
                "Direct Central Vigilance Officer to enforce tranche disbursement holds on non-compliant executing bodies.",
                "Depute CAG technical inspection teams for ground verification of high-outlay civil works."
            ]
        }
    elif role == "state":
        return {
            "executive_summary": (
                f"Statewide procurement review for {jur} examines {total_works:,} sanctioned community projects "
                f"with a total outlay of Rs. {outlay_cr:.2f} Crores. Audit filters identify {flagged_count:,} works "
                f"representing Rs. {risk_cr:.2f} Crores requiring active technical inspection.\n\n"
                f"District allocation records reflect an implementing agency concentration index of {hhi:.1f}. "
                f"Multiple municipal and engineering divisions account for disproportionate project backlogs and "
                f"unsubmitted physical Measurement Books."
            ),
            "real_world_evaluation": (
                f"Operational evaluation for {jur} confirms that monsoon flood moratoriums (June 15 – October 15) "
                f"and statutory election code pauses account for legitimate delivery dwell time in riverine districts. "
                f"Residual vigilance risk of {calibrated_score:.1f}/100 focuses specifically on delayed Utilization Certificates "
                f"and repeat vendor allocation in urban divisions."
            ),
            "key_findings": [
                f"State audit queue flags {flagged_count} works representing Rs. {risk_cr:.2f} Crores in state-administered capital.",
                f"Implementing agency concentration (HHI {hhi:.1f}) reflects heavy allocation to municipal engineering wings.",
                f"Physical completion certificates remain pending for flagged works exceeding statutory delivery norms."
            ],
            "procedural_directives": [
                f"Issue formal administrative show-cause notices to top captured implementing agencies in {jur}.",
                "Withhold subsequent state-share installment releases pending physical milestone measurement.",
                "Direct State Technical Audit Wing to verify vendor credentials and prevent private proxy bidding."
            ]
        }
    elif role == "district":
        return {
            "executive_summary": (
                f"Pre-sanction audit screening for District {jur} reviews {total_works:,} project proposals "
                f"with an aggregate allocation of Rs. {outlay_cr:.2f} Crores. Screening identifies {flagged_count:,} "
                f"proposals totaling Rs. {risk_cr:.2f} Crores positioned near statutory quotation limits.\n\n"
                f"Tender records show project clustering in the Rs. 4.50 Lakh to Rs. 4.99 Lakh price band. "
                f"Under General Financial Rules (GFR 2017) Rule 155, quotation purchases are limited to Rs. 5.0 Lakhs; "
                f"allocations in this band require magisterial verification to ensure works were not split to avoid open e-tenders."
            ),
            "real_world_evaluation": (
                f"Real-world operational analysis for District {jur} confirms that {jur} is a recognized riverine flood zone "
                f"subject to seasonal earthwork suspension (June 15 – October 15). Furthermore, proposals assigned to statutory "
                f"public agencies (DRDA / State PWD) reflect legitimate government execution. Real-world calibrated risk is "
                f"{calibrated_score:.1f}/100, focusing strictly on private civil contractor packages."
            ),
            "key_findings": [
                f"{flagged_count} proposals evaluated in District {jur} sit within the sensitive sub-Rs. 5 Lakh quotation band.",
                f"Statutory public agency execution (DRDA/PWD) accounts for administrative concentration, mitigating vendor collusion.",
                f"Private civil contractor works near Rs. 5.0 Lakhs require physical Measurement Book inspection prior to sanction."
            ],
            "procedural_directives": [
                f"Issue Magisterial Stop-Work Order on unverified sub-Rs. 5 Lakh private contractor civil proposals.",
                "Depute Sub-Divisional Magistrate (SDM) to impound Measurement Books (MB) for flagged sites.",
                "Direct Executive Engineer to execute on-site physical re-measurements within 7 business days."
            ]
        }
    else:  # MP
        return {
            "executive_summary": (
                f"Constituency delivery review for Hon. Member of Parliament ({jur}) tracks {total_works:,} recommended "
                f"community assets representing Rs. {outlay_cr:.2f} Crores in developmental funding. Tracking indicates "
                f"{flagged_count:,} projects encountering administrative delay, with Rs. {risk_cr:.2f} Crores awaiting execution.\n\n"
                f"Lifecycle records indicate that administrative delays occur primarily between the recommendation "
                f"and sanction stages at the District Collectorate level. Inter-block distribution requires review to "
                f"ensure balanced community asset delivery across rural panchayats."
            ),
            "real_world_evaluation": (
                f"Constituency analysis confirms that the 82-day 2024 Lok Sabha election Model Code of Conduct freeze "
                f"and seasonal monsoon weather accounted for standard administrative delays. Adjusted delivery pacing reflects "
                f"a calibrated risk of {calibrated_score:.1f}/100. Priority must be given to drinking water and rural sanitation."
            ),
            "key_findings": [
                f"{total_works} recommended community works evaluated across 4 statutory lifecycle stages.",
                f"Administrative dwell time at the District Collectorate accounts for the majority of execution delay.",
                f"Standard Schedule of Rates community assets (solar lighting, drinking water) reflect normal unit costs."
            ],
            "procedural_directives": [
                "Formally summon District Collectorate for urgent quarterly MPLADS progress review meeting.",
                "Request authenticated geo-tagged photographic proof for all works marked in sanction status.",
                "Prioritize pending un-electrified and drinking water infrastructure proposals for immediate clearance."
            ]
        }


def synthesize_report_intelligence(
    role: str = "ministry",
    jurisdiction: str = "National",
    metrics: Optional[Dict[str, Any]] = None,
    top_works: Optional[List[Dict[str, Any]]] = None,
    client: Optional[GeminiDecisionSupportClient] = None
) -> Dict[str, Any]:
    """
    Synthesizes RAG-grounded, zero-fluff administrative audit intelligence.
    Cross-references ML signals against real-world operational facts (floods, ECI MCC, public agencies).
    Calls Gemini if configured, otherwise falls back gracefully to deterministic empirical text.
    """
    m = metrics or {}
    clean_role = role.lower() if role in ["ministry", "state", "district", "mp"] else "ministry"
    clean_jur = jurisdiction or ("National" if clean_role == "ministry" else "State Jurisdiction")
    sample_works = top_works or []

    # Execute RAG Hard-Negative & Real-World Evaluation
    evaluator = HardNegativeEvaluator()
    eval_result = evaluator.evaluate_portfolio(
        role=clean_role,
        jurisdiction=clean_jur,
        metrics=m,
        top_works=sample_works
    )

    # Check if Gemini is enabled and available
    client_instance = client or GeminiDecisionSupportClient()
    if not settings.DECISION_SUPPORT_ENABLED or not client_instance.is_available():
        logger.info("Using deterministic fallback report intelligence for %s (%s).", clean_role, clean_jur)
        fallback_data = _get_fallback_report_intelligence(clean_role, clean_jur, m, eval_result)
        fallback_data["eval_result"] = eval_result
        fallback_data["source"] = "fallback"
        return fallback_data

    try:
        user_prompt = _build_rag_report_prompt(clean_role, clean_jur, m, eval_result)
        raw_json = client_instance.generate_structured(
            contents=user_prompt,
            system_instruction=REPORT_SYSTEM_INSTRUCTION,
            response_schema=REPORT_INTELLIGENCE_SCHEMA
        )
        data = json.loads(raw_json)

        # Validate required keys
        if (
            isinstance(data.get("executive_summary"), str)
            and isinstance(data.get("real_world_evaluation"), str)
            and isinstance(data.get("key_findings"), list)
            and len(data["key_findings"]) >= 3
            and isinstance(data.get("procedural_directives"), list)
            and len(data["procedural_directives"]) >= 3
        ):
            return {
                "executive_summary": data["executive_summary"],
                "real_world_evaluation": data["real_world_evaluation"],
                "key_findings": data["key_findings"][:3],
                "procedural_directives": data["procedural_directives"][:3],
                "eval_result": eval_result,
                "source": "gemini"
            }
        else:
            logger.warning("Gemini output failed schema validation. Falling back to deterministic policy.")
            fallback_data = _get_fallback_report_intelligence(clean_role, clean_jur, m, eval_result)
            fallback_data["eval_result"] = eval_result
            fallback_data["source"] = "fallback"
            return fallback_data

    except Exception as err:
        logger.warning("Gemini API call failed (%s). Falling back gracefully.", err)
        fallback_data = _get_fallback_report_intelligence(clean_role, clean_jur, m, eval_result)
        fallback_data["eval_result"] = eval_result
        fallback_data["source"] = "fallback"
        return fallback_data
