"""Stage 4: Multi-Signal Risk Fusion Engine for SETU MPLADS Platform.

Synthesizes intermediate evidence signals (Models 1–7) and supervised calibrated probability (Model 8)
into actionable administrative intelligence, multi-tier risk classifications, and explainable audit traces.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Any, Dict, List, Optional, Tuple, Union

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parents[3]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import numpy as np
import pandas as pd


class RiskFusionEngine:
    """Multi-signal risk fusion engine synthesizing supervised fraud probabilities and 7 domain anomaly signals."""

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        data_dir: Optional[Union[str, Path]] = None,
        reports_dir: Optional[Union[str, Path]] = None,
    ):
        self.weights = weights or {
            "financial_anomaly_score": 0.15,
            "geospatial_anomaly_score": 0.10,
            "procurement_anomaly_score": 0.15,
            "contractor_anomaly_score": 0.18,
            "payment_anomaly_score": 0.15,
            "progress_anomaly_score": 0.12,
            "graph_anomaly_score": 0.15,
        }
        self.data_dir = (
            Path(data_dir)
            if data_dir
            else Path(__file__).resolve().parents[1] / "data" / "processed"
        )
        self.reports_dir = (
            Path(reports_dir)
            if reports_dir
            else Path(__file__).resolve().parents[1] / "reports"
        )

    def calculate_risk_score(
        self,
        domain_scores: Dict[str, float],
        fraud_probability: float,
    ) -> float:
        """Calculate overall SETU risk score (0.0 to 100.0) combining supervised and unsupervised signals."""
        unsupervised_sum = 0.0
        total_weight = 0.0

        for col, w in self.weights.items():
            val = float(domain_scores.get(col, 0.0) or 0.0)
            unsupervised_sum += val * w
            total_weight += w

        unsupervised_component = (
            (unsupervised_sum / total_weight) if total_weight > 0 else 0.0
        )
        supervised_component = float(fraud_probability) * 100.0

        max_domain = max(
            [float(domain_scores.get(c, 0.0) or 0.0) for c in self.weights.keys()] or [0.0]
        )

        # Multi-signal triangulation:
        # Balanced blend: 40% supervised calibrated probability + 35% unsupervised multi-domain signals + 25% peak domain anomaly
        fused = 0.40 * supervised_component + 0.35 * unsupervised_component + 0.25 * max_domain

        # Acute overrides: Require corroboration between high peak domain and non-trivial supervised probability
        # Prevents a single isolated unsupervised model (e.g. rural hospital geospatial) from forcing CRITICAL when supervised fraud is ~1%
        if fraud_probability >= 0.70 or (max_domain >= 88.0 and fraud_probability >= 0.15):
            fused = max(fused, 82.0)
        elif fraud_probability >= 0.35 or (max_domain >= 68.0 and fraud_probability >= 0.08):
            fused = max(fused, 65.0)
        elif fraud_probability >= 0.12 or (max_domain >= 48.0 and fraud_probability >= 0.05):
            fused = max(fused, 42.0)
        elif max_domain >= 88.0:
            # Single acute anomaly with low supervised probability: set awareness floor (CONDITIONAL_APPROVAL), not conviction
            fused = max(fused, 38.0)

        return round(float(np.clip(fused, 0.0, 100.0)), 1)

    def classify_risk_tier(self, score: float, fraud_probability: float) -> str:
        """Classify project into one of 4 administrative risk tiers."""
        if score >= 80.0 or fraud_probability >= 0.70:
            return "CRITICAL"
        elif score >= 60.0 or fraud_probability >= 0.35:
            return "HIGH"
        elif score >= 40.0 or fraud_probability >= 0.12:
            return "MEDIUM"
        else:
            return "LOW"

    def determine_investigation_priority(self, risk_level: str) -> str:
        """Determine operational audit workflow priority."""
        if risk_level == "CRITICAL":
            return "IMMEDIATE"
        elif risk_level == "HIGH":
            return "PRIORITY"
        else:
            return "ROUTINE"

    def synthesize_reason_traces(
        self,
        domain_scores: Dict[str, float],
        domain_reasons: Dict[str, List[str]],
        fraud_probability: float,
        predicted_typology: str,
    ) -> List[str]:
        """Rank and synthesize explainable audit evidence from the highest anomaly domains."""
        # Rank domains by their anomaly scores
        ranked_domains = sorted(
            domain_scores.items(), key=lambda x: float(x[1] or 0.0), reverse=True
        )

        reasons: List[str] = []

        domain_label_map = {
            "financial_anomaly_score": "Financial Execution",
            "geospatial_anomaly_score": "Geospatial Clustering",
            "procurement_anomaly_score": "Tender & Procurement",
            "contractor_anomaly_score": "Contractor Capacity",
            "payment_anomaly_score": "Payment Structuring",
            "progress_anomaly_score": "Physical-Financial Trajectory",
            "graph_anomaly_score": "Entity Graph Relationship",
        }

        # Collect top reasons from domains with significant anomaly signals (>= 40.0)
        for domain_key, score in ranked_domains:
            if score >= 40.0 and domain_key in domain_reasons:
                domain_name = domain_label_map.get(domain_key, domain_key)
                for r in domain_reasons[domain_key]:
                    if r and r not in reasons and len(r.strip()) > 5:
                        reasons.append(f"[{domain_name}] {r.strip()}")
                        if len(reasons) >= 5:
                            break
            if len(reasons) >= 5:
                break

        # If no specific domain reason exceeded threshold
        if not reasons:
            if fraud_probability >= 0.50 and predicted_typology != "NORMAL":
                reasons.append(
                    f"Supervised risk model detected correlated anomalous multi-signal indicators for archetype: {predicted_typology}"
                )
            else:
                reasons.append(
                    "Standard MPLADS project execution profile adhering to statutory norms"
                )

        return reasons[:5]

    def fuse_project(
        self,
        project_id: str,
        domain_scores: Dict[str, float],
        domain_reasons: Dict[str, List[str]],
        fraud_probability: float,
        predicted_typology: str = "NORMAL",
    ) -> Dict[str, Any]:
        """Fuse signals for an individual project."""
        score = self.calculate_risk_score(domain_scores, fraud_probability)
        level = self.classify_risk_tier(score, fraud_probability)
        priority = self.determine_investigation_priority(level)
        reasons = self.synthesize_reason_traces(
            domain_scores=domain_scores,
            domain_reasons=domain_reasons,
            fraud_probability=fraud_probability,
            predicted_typology=predicted_typology,
        )

        primary_typology = (
            predicted_typology
            if predicted_typology != "NORMAL"
            else ("ANOMALOUS_PROFILE" if score >= 60.0 else "NORMAL")
        )

        return {
            "project_id": project_id,
            "overall_risk_score": score,
            "risk_level": level,
            "investigation_priority": priority,
            "primary_typology": primary_typology,
            "fraud_probability": round(float(fraud_probability), 4),
            "synthesized_reasons": reasons,
            "primary_reason": reasons[0] if len(reasons) > 0 else "Normal project profile",
            "secondary_reason": reasons[1] if len(reasons) > 1 else "",
            "tertiary_reason": reasons[2] if len(reasons) > 2 else "",
        }

    def fuse_signals(
        self,
        row_dict: Optional[dict] = None,
        xgb_proba: float = 0.0,
        if_score: float = 0.0,
        lof_score: float = 0.0,
        graph_ida_risk: float = 0.0,
        **kwargs: Any,
    ) -> Tuple[float, str, List[str], Dict[str, float], str]:
        """Legacy compatibility method supporting earlier prototype calls."""
        row_dict = row_dict or {}
        cost_signal = np.clip(
            max(
                float(row_dict.get("ALLOC_ZSCORE_STATE", 0.0) or 0.0),
                float(row_dict.get("ALLOC_ZSCORE_WORKTYPE", 0.0) or 0.0),
            )
            / 3.0,
            0.0,
            1.0,
        )
        dupe_count = int(row_dict.get("DUPLICATE_COUNT", 1) or 1)
        dupe_signal = 0.95 if dupe_count >= 5 else (0.70 if dupe_count >= 2 else 0.0)
        struct_score = float(row_dict.get("STRUCTURING_SCORE", 0.0) or 0.0)
        ida_share = float(row_dict.get("IDA_MP_WORK_SHARE", 0.0) or 0.0)
        stall_score = float(row_dict.get("STALL_RISK_SCORE", 0.0) or 0.0)

        domain_scores = {
            "financial_anomaly_score": cost_signal * 100.0,
            "geospatial_anomaly_score": dupe_signal * 100.0,
            "procurement_anomaly_score": struct_score * 100.0,
            "contractor_anomaly_score": max(ida_share, graph_ida_risk) * 100.0,
            "payment_anomaly_score": struct_score * 100.0,
            "progress_anomaly_score": stall_score * 100.0,
            "graph_anomaly_score": graph_ida_risk * 100.0,
        }

        sub_scores = {
            "cost_anomaly": round(cost_signal * 100.0, 1),
            "duplicate_risk": round(dupe_signal * 100.0, 1),
            "structuring_risk": round(struct_score * 100.0, 1),
            "vendor_concentration": round(max(ida_share, graph_ida_risk) * 100.0, 1),
            "stall_risk": round(stall_score * 100.0, 1),
            "ml_fraud_probability": round(xgb_proba * 100.0, 1),
        }

        domain_reasons = {
            "financial_anomaly_score": ["Peer cost is above regional benchmark"] if cost_signal > 0.4 else [],
            "geospatial_anomaly_score": [f"High-density cluster with {dupe_count} works"] if dupe_count >= 2 else [],
            "procurement_anomaly_score": ["Allocation structured below statutory threshold"] if struct_score > 0.6 else [],
            "contractor_anomaly_score": ["Implementing Agency monopolization detected"] if ida_share > 0.6 else [],
            "progress_anomaly_score": ["Stalled execution without reported progress"] if stall_score > 0.5 else [],
        }

        fused = self.fuse_project(
            project_id=row_dict.get("WORK_ID", "WORK-001"),
            domain_scores=domain_scores,
            domain_reasons=domain_reasons,
            fraud_probability=xgb_proba,
            predicted_typology="ANOMALOUS_PROFILE" if xgb_proba >= 0.5 else "NORMAL",
        )

        score = fused["overall_risk_score"]
        # Format level for legacy test expectation ("Critical", "High", "Medium", "Low")
        level_legacy = fused["risk_level"].capitalize()
        reasons = fused["synthesized_reasons"]

        # Legacy typology
        fraud_type_signals = {
            "overpricing": cost_signal,
            "duplicate": dupe_signal,
            "structuring": struct_score,
            "vendor_capture": max(ida_share, graph_ida_risk),
            "ghost_project": stall_score,
        }
        max_type = max(fraud_type_signals, key=fraud_type_signals.get)
        predicted_f_type = max_type if fraud_type_signals[max_type] > 0.45 or score >= 60.0 else "none"

        return score, level_legacy, reasons, sub_scores, predicted_f_type

    def load_and_fuse_all_models(self) -> pd.DataFrame:
        """Load all 7 intermediate score files and Stage 3 supervised scores, fusing all 5,000 projects."""
        print("Loading intermediate and supervised model score files...")

        # 1. Financial
        f_fin = self.data_dir / "financial_anomaly_scores.csv"
        df_fin = pd.read_csv(f_fin)

        # 2. Geospatial
        f_geo = self.data_dir / "geospatial_anomaly_scores.csv"
        df_geo = pd.read_csv(f_geo)

        # 3. Procurement
        f_proc = self.data_dir / "procurement_anomaly_scores.csv"
        df_proc = pd.read_csv(f_proc)

        # 4. Contractor
        f_contr = self.data_dir / "contractor_anomaly_scores.csv"
        df_contr = pd.read_csv(f_contr)
        if "contractor_agency_anomaly_score" in df_contr.columns:
            df_contr = df_contr.rename(columns={"contractor_agency_anomaly_score": "contractor_anomaly_score"})

        # 5. Payment
        f_pay = self.data_dir / "payment_anomaly_scores.csv"
        df_pay = pd.read_csv(f_pay)

        # 6. Progress
        f_prog = self.data_dir / "progress_execution_anomaly_scores.csv"
        df_prog = pd.read_csv(f_prog)

        # 7. Graph
        f_graph = self.data_dir / "graph_anomaly_scores.csv"
        df_graph = pd.read_csv(f_graph)

        # 8. Supervised Fraud Predictor
        f_sup = self.data_dir / "supervised_fraud_scores.csv"
        df_sup = pd.read_csv(f_sup)

        # Merge base table
        merged = (
            df_fin[["project_id", "financial_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
            .rename(columns={"primary_reason": "fin_r1", "secondary_reason": "fin_r2", "tertiary_reason": "fin_r3"})
            .merge(
                df_geo[["project_id", "geospatial_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
                .rename(columns={"primary_reason": "geo_r1", "secondary_reason": "geo_r2", "tertiary_reason": "geo_r3"}),
                on="project_id",
            )
            .merge(
                df_proc[["project_id", "procurement_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
                .rename(columns={"primary_reason": "proc_r1", "secondary_reason": "proc_r2", "tertiary_reason": "proc_r3"}),
                on="project_id",
            )
            .merge(
                df_contr[["project_id", "contractor_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
                .rename(columns={"primary_reason": "contr_r1", "secondary_reason": "contr_r2", "tertiary_reason": "contr_r3"}),
                on="project_id",
            )
            .merge(
                df_pay[["project_id", "payment_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
                .rename(columns={"primary_reason": "pay_r1", "secondary_reason": "pay_r2", "tertiary_reason": "pay_r3"}),
                on="project_id",
            )
            .merge(
                df_prog[["project_id", "progress_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
                .rename(columns={"primary_reason": "prog_r1", "secondary_reason": "prog_r2", "tertiary_reason": "prog_r3"}),
                on="project_id",
            )
            .merge(
                df_graph[["project_id", "graph_anomaly_score", "primary_reason", "secondary_reason", "tertiary_reason"]]
                .rename(columns={"primary_reason": "graph_r1", "secondary_reason": "graph_r2", "tertiary_reason": "graph_r3"}),
                on="project_id",
            )
            .merge(
                df_sup[["project_id", "fraud_probability", "predicted_typology", "feature_importance_contributions"]],
                on="project_id",
            )
        )

        print(f"Merged all 8 model scores for {len(merged)} projects.")

        fused_rows: List[Dict[str, Any]] = []

        for _, row in merged.iterrows():
            domain_scores = {
                "financial_anomaly_score": float(row["financial_anomaly_score"]),
                "geospatial_anomaly_score": float(row["geospatial_anomaly_score"]),
                "procurement_anomaly_score": float(row["procurement_anomaly_score"]),
                "contractor_anomaly_score": float(row["contractor_anomaly_score"]),
                "payment_anomaly_score": float(row["payment_anomaly_score"]),
                "progress_anomaly_score": float(row["progress_anomaly_score"]),
                "graph_anomaly_score": float(row["graph_anomaly_score"]),
            }

            domain_reasons = {
                "financial_anomaly_score": [str(r) for r in [row["fin_r1"], row["fin_r2"], row["fin_r3"]] if pd.notna(r)],
                "geospatial_anomaly_score": [str(r) for r in [row["geo_r1"], row["geo_r2"], row["geo_r3"]] if pd.notna(r)],
                "procurement_anomaly_score": [str(r) for r in [row["proc_r1"], row["proc_r2"], row["proc_r3"]] if pd.notna(r)],
                "contractor_anomaly_score": [str(r) for r in [row["contr_r1"], row["contr_r2"], row["contr_r3"]] if pd.notna(r)],
                "payment_anomaly_score": [str(r) for r in [row["pay_r1"], row["pay_r2"], row["pay_r3"]] if pd.notna(r)],
                "progress_anomaly_score": [str(r) for r in [row["prog_r1"], row["prog_r2"], row["prog_r3"]] if pd.notna(r)],
                "graph_anomaly_score": [str(r) for r in [row["graph_r1"], row["graph_r2"], row["graph_r3"]] if pd.notna(r)],
            }

            fused_dict = self.fuse_project(
                project_id=row["project_id"],
                domain_scores=domain_scores,
                domain_reasons=domain_reasons,
                fraud_probability=float(row["fraud_probability"]),
                predicted_typology=str(row["predicted_typology"]),
            )

            # Add domain scores for transparent auditing
            fused_dict.update(domain_scores)
            fused_dict["feature_importance_contributions"] = row["feature_importance_contributions"]
            fused_dict["synthesized_reasons"] = json.dumps(fused_dict["synthesized_reasons"])
            fused_dict["scored_at"] = datetime.now(timezone.utc).isoformat()

            fused_rows.append(fused_dict)

        output_df = pd.DataFrame(fused_rows)
        return output_df

    def export_reports(self, fused_df: pd.DataFrame) -> Tuple[Path, Path]:
        """Generate audit intelligence Markdown and JSON reports."""
        self.reports_dir.mkdir(parents=True, exist_ok=True)

        md_path = self.reports_dir / "RISK_FUSION_REPORT.md"
        json_path = self.reports_dir / "risk_fusion_report.json"

        # Tiers distribution
        tier_counts = fused_df["risk_level"].value_counts().to_dict()
        priority_counts = fused_df["investigation_priority"].value_counts().to_dict()
        typology_counts = fused_df["primary_typology"].value_counts().to_dict()

        json_summary = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_projects_evaluated": len(fused_df),
            "risk_tier_distribution": tier_counts,
            "investigation_priority_distribution": priority_counts,
            "typology_distribution": typology_counts,
            "risk_score_statistics": {
                "mean": round(float(fused_df["overall_risk_score"].mean()), 2),
                "median": round(float(fused_df["overall_risk_score"].median()), 2),
                "std": round(float(fused_df["overall_risk_score"].std()), 2),
                "min": round(float(fused_df["overall_risk_score"].min()), 2),
                "max": round(float(fused_df["overall_risk_score"].max()), 2),
            },
        }

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(json_summary, f, indent=2)

        # Markdown Report
        lines = [
            "# SETU Multi-Signal Risk Fusion Intelligence Report",
            "",
            f"**Generated**: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}  ",
            "**Architecture**: Multi-Evidence Synthesis Engine combining Models 1–7 (Intermediate Domain Anomaly Scores) & Model 8 (Supervised Calibrated Fraud Predictor)  ",
            f"**Total Works Evaluated**: {len(fused_df):,} MPLADS Projects  ",
            "",
            "---",
            "",
            "## 1. Administrative Risk Tier Breakdown",
            "",
            "| Risk Tier | Score Threshold | Project Count | Percentage | Operational Action Required |",
            "| :--- | :---: | :---: | :---: | :--- |",
            f"| **`CRITICAL`** | $\\ge 80.0$ or $P \\ge 0.85$ | **{tier_counts.get('CRITICAL', 0):,}** | **{tier_counts.get('CRITICAL', 0)/len(fused_df)*100:.1f}%** | Immediate Administrative Freeze & Physical Joint Inspection |",
            f"| **`HIGH`** | $60.0 - 79.9$ | **{tier_counts.get('HIGH', 0):,}** | **{tier_counts.get('HIGH', 0)/len(fused_df)*100:.1f}%** | Prioritized District Magistrate Desk Audit |",
            f"| **`MEDIUM`** | $40.0 - 59.9$ | **{tier_counts.get('MEDIUM', 0):,}** | **{tier_counts.get('MEDIUM', 0)/len(fused_df)*100:.1f}%** | Routine Monitoring with Flagged Documentation Requirements |",
            f"| **`LOW`** | $< 40.0$ | **{tier_counts.get('LOW', 0):,}** | **{tier_counts.get('LOW', 0)/len(fused_df)*100:.1f}%** | Standard Execution within Normal Parameters |",
            "",
            "---",
            "",
            "## 2. Investigation Priority Allocation",
            "",
            "| Priority Level | Project Count | Share | Recommended Lead Agency |",
            "| :--- | :---: | :---: | :--- |",
            f"| **`IMMEDIATE`** | **{priority_counts.get('IMMEDIATE', 0):,}** | **{priority_counts.get('IMMEDIATE', 0)/len(fused_df)*100:.1f}%** | State Vigilance & MoSPI Central Audit Wing |",
            f"| **`PRIORITY`** | **{priority_counts.get('PRIORITY', 0):,}** | **{priority_counts.get('PRIORITY', 0)/len(fused_df)*100:.1f}%** | District Nodal Officer & Chief Engineer |",
            f"| **`ROUTINE`** | **{priority_counts.get('ROUTINE', 0):,}** | **{priority_counts.get('ROUTINE', 0)/len(fused_df)*100:.1f}%** | Implementing District Agency (IDA) Standard Monitoring |",
            "",
            "---",
            "",
            "## 3. Typology Archetype Distribution",
            "",
            "| Primary Typology Archetype | Count | Share |",
            "| :--- | :---: | :---: |",
        ]

        for typ, cnt in sorted(typology_counts.items(), key=lambda x: x[1], reverse=True):
            lines.append(f"| `{typ}` | {cnt:,} | {cnt/len(fused_df)*100:.1f}% |")

        lines.extend([
            "",
            "---",
            "",
            "## 4. Top Critical Projects Flagged for Immediate Intervention",
            "",
            "| Project ID | Risk Score | Level | Priority | Primary Typology | Leading Synthesized Evidence |",
            "| :--- | :---: | :---: | :---: | :--- | :--- |",
        ])

        top_critical = fused_df[fused_df["risk_level"] == "CRITICAL"].sort_values(
            "overall_risk_score", ascending=False
        ).head(10)

        for _, row in top_critical.iterrows():
            lines.append(
                f"| `{row['project_id']}` | **{row['overall_risk_score']:.1f}** | `{row['risk_level']}` | `{row['investigation_priority']}` | `{row['primary_typology']}` | {row['primary_reason']} |"
            )

        lines.extend([
            "",
            "---",
            "",
            "**SETU — Smart Evidence-based Triangulation for Uncovering Anomalies in MPLADS**  ",
            "*Ministry of Statistics and Programme Implementation (MoSPI) — Government of India.*",
        ])

        with open(md_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")

        return md_path, json_path


def main():
    """CLI runner to fuse all models, export fused_risk_intelligence.csv, and produce audit reports."""
    print("=== [SETU STAGE 4] Launching Multi-Signal Risk Fusion Engine ===")
    engine = RiskFusionEngine()
    fused_df = engine.load_and_fuse_all_models()

    output_csv = engine.data_dir / "fused_risk_intelligence.csv"
    fused_df.to_csv(output_csv, index=False)
    print(f"Exported fused risk intelligence dataset: {output_csv} ({len(fused_df)} rows)")

    md_path, json_path = engine.export_reports(fused_df)
    print(f"Generated Markdown report: {md_path}")
    print(f"Generated JSON report: {json_path}")
    print("=== [SETU STAGE 4] Risk Fusion Engine Execution Complete! ===")


if __name__ == "__main__":
    main()
