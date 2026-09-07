"""Hard-Negative & Real-World Risk Evaluator for Public Works Auditing.

Cross-references raw ML statistical signals against external operational ground-truth
(monsoon moratoriums, ECI election freezes, statutory agency mandates, and SoR unit baselines)
to distinguish genuine malfeasance from explainable operational realities.
"""

from typing import Dict, Any, List, Optional
from app.ml.rag.retriever import RAGRetriever


class HardNegativeEvaluator:
    """Evaluates whether high ML risk scores reflect genuine malfeasance or hard-negative operational realities."""

    def __init__(self, retriever: Optional[RAGRetriever] = None):
        self.retriever = retriever or RAGRetriever()

    def evaluate_portfolio(
        self,
        role: str,
        jurisdiction: str,
        metrics: Dict[str, Any],
        top_works: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates a portfolio of flagged works against real-world external context.
        Returns a calibrated risk verdict, mitigating operational evidence, and confirmed fraud traces.
        """
        rag_context = self.retriever.retrieve_context(
            role=role,
            jurisdiction=jurisdiction,
            metrics=metrics,
            sample_works=top_works
        )

        analyzed_works = rag_context.get("analyzed_sample_works", [])
        total_analyzed = len(analyzed_works) or 1
        mitigated_works = [w for w in analyzed_works if w.get("is_hard_negative")]
        confirmed_works = [w for w in analyzed_works if len(w.get("confirmed_flags", [])) > 0]

        mitigation_ratio = len(mitigated_works) / float(total_analyzed)

        # Classify portfolio-level verdict
        if mitigation_ratio >= 0.60:
            portfolio_verdict = "HARD_NEGATIVE_MITIGATED"
            verdict_summary = (
                f"Significant portion ({len(mitigated_works)}/{total_analyzed}) of flagged statistical outliers are "
                f"mitigated by verified real-world factors: statutory election blackout (ECI MCC 2024), seasonal "
                f"flood moratoriums, and statutory public agency designations."
            )
        elif len(confirmed_works) > 0 and len(mitigated_works) > 0:
            portfolio_verdict = "MIXED_EXPOSURE"
            verdict_summary = (
                f"Portfolio exhibits dual characteristics: {len(mitigated_works)} projects reflect explainable operational "
                f"delays (election freeze / seasonal floods), while {len(confirmed_works)} projects represent unmitigated "
                f"anomalies requiring active field investigation."
            )
        else:
            portfolio_verdict = "CONFIRMED_ANOMALY"
            verdict_summary = (
                f"Flagged risk outliers exhibit zero operational, seasonal, or statutory mitigating factors. "
                f"Audit patterns indicate actionable non-compliance with statutory procurement thresholds."
            )

        # Collect distinct operational mitigating points
        operational_mitigations = list(rag_context.get("general_mitigations", []))
        for w in analyzed_works:
            for m in w.get("mitigations", []):
                if m not in operational_mitigations:
                    operational_mitigations.append(m)

        # Collect distinct confirmed non-compliance traces
        confirmed_traces = []
        for w in analyzed_works:
            for f in w.get("confirmed_flags", []):
                if f not in confirmed_traces:
                    confirmed_traces.append(f)

        if not confirmed_traces and len(confirmed_works) == 0 and len(mitigated_works) > 0:
            confirmed_traces.append("No confirmed unmitigated procurement violations detected in analyzed sample.")

        # Real-World Calibrated Risk Score
        raw_avg_risk = float(metrics.get("avg_risk") or 50.0)
        calibrated_score = raw_avg_risk
        if portfolio_verdict == "HARD_NEGATIVE_MITIGATED":
            calibrated_score = max(20.0, raw_avg_risk * 0.55)
        elif portfolio_verdict == "MIXED_EXPOSURE":
            calibrated_score = max(35.0, raw_avg_risk * 0.80)

        return {
            "portfolio_verdict": portfolio_verdict,
            "verdict_summary": verdict_summary,
            "raw_risk_score": round(raw_avg_risk, 1),
            "calibrated_risk_score": round(calibrated_score, 1),
            "total_analyzed": total_analyzed,
            "mitigated_count": len(mitigated_works),
            "confirmed_count": len(confirmed_works),
            "operational_mitigations": operational_mitigations[:4],
            "confirmed_traces": confirmed_traces[:4],
            "statutory_rules": rag_context.get("statutory_rules", [])[:3],
            "evaluated_works": analyzed_works
        }

