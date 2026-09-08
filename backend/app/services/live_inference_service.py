"""Live Inference Service for End-to-End MPLADS Proposal Scoring.

Loads all 8 production machine learning models in-memory to evaluate
unseen project proposals in real time (< 200ms) with multi-evidence explainability.

MoSPI SETU MPLADS Anomaly Detection Platform.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import time
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd

from app.core.config import settings, BASE_DIR
from app.ml.models.risk_fusion_engine import RiskFusionEngine


class LiveInferenceService:
    """In-memory singleton service providing real-time multi-model evaluation for new MPLADS proposals."""

    _instance: Optional["LiveInferenceService"] = None

    def __init__(self):
        self.models_base_dir = Path(BASE_DIR) / "app" / "ml" / "models"
        self.data_processed_dir = Path(BASE_DIR) / "app" / "ml" / "data" / "processed"

        # Calibration bounds derived from national training baseline distributions
        self.payment_bounds = {"min": -0.2270, "max": 0.1175}
        self.progress_bounds = {"min": -0.2598, "max": 0.1271}
        self.graph_bounds = {"min": -0.1946, "max": 0.1454}

        print("[SETU Live Inference] Loading 8 production models and preprocessors into memory...")
        self._load_all_models()
        self._load_feature_template()
        self.fusion_engine = RiskFusionEngine(data_dir=self.data_processed_dir)
        print("[SETU Live Inference] All 8 models active in-memory. Live proposal scoring ready.")

    @classmethod
    def get_instance(cls) -> "LiveInferenceService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_all_models(self) -> None:
        """Load all 7 unsupervised domain models and the supervised calibrated model from disk."""
        # 1. Financial
        self.financial_prep = joblib.load(
            self.models_base_dir / "financial" / "artifacts" / "financial_preprocessor.joblib"
        )
        self.financial_model = joblib.load(
            self.models_base_dir / "financial" / "artifacts" / "financial_isolation_forest.joblib"
        )

        # 2. Geospatial
        self.geospatial_prep = joblib.load(
            self.models_base_dir / "geospatial" / "artifacts" / "geospatial_preprocessor.joblib"
        )
        self.geospatial_model = joblib.load(
            self.models_base_dir / "geospatial" / "artifacts" / "geospatial_isolation_forest.joblib"
        )

        # 3. Procurement
        self.procurement_prep = joblib.load(
            self.models_base_dir / "procurement" / "artifacts" / "procurement_preprocessor.joblib"
        )
        self.procurement_model = joblib.load(
            self.models_base_dir / "procurement" / "artifacts" / "procurement_isolation_forest.joblib"
        )

        # 4. Contractor
        self.contractor_prep = joblib.load(
            self.models_base_dir / "contractor" / "artifacts" / "contractor_preprocessor.joblib"
        )
        self.contractor_model = joblib.load(
            self.models_base_dir / "contractor" / "artifacts" / "contractor_isolation_forest.joblib"
        )

        # 5. Payment
        self.payment_prep = joblib.load(
            self.models_base_dir / "payment" / "artifacts" / "payment_preprocessor.joblib"
        )
        self.payment_model = joblib.load(
            self.models_base_dir / "payment" / "artifacts" / "payment_isolation_forest.joblib"
        )

        # 6. Progress
        self.progress_prep = joblib.load(
            self.models_base_dir / "progress" / "artifacts" / "progress_preprocessor.joblib"
        )
        self.progress_model = joblib.load(
            self.models_base_dir / "progress" / "artifacts" / "progress_isolation_forest.joblib"
        )

        # 7. Graph
        self.graph_prep = joblib.load(
            self.models_base_dir / "graph" / "artifacts" / "graph_preprocessor.joblib"
        )
        self.graph_model = joblib.load(
            self.models_base_dir / "graph" / "artifacts" / "graph_isolation_forest.joblib"
        )

        # 8. Supervised Calibrated Classifier
        self.supervised_prep = joblib.load(
            self.models_base_dir / "supervised" / "artifacts" / "supervised_preprocessor.joblib"
        )
        self.supervised_model = joblib.load(
            self.models_base_dir / "supervised" / "artifacts" / "supervised_fraud_model.joblib"
        )

    def _load_feature_template(self) -> None:
        """Load reference row template containing standard national median baseline attributes."""
        master_csv = self.data_processed_dir / "project_master_features.csv"
        if master_csv.exists():
            df_sample = pd.read_csv(master_csv, nrows=100)
            # Create a 1-row reference template using column medians / modes
            numeric_cols = df_sample.select_dtypes(include=[np.number]).columns
            object_cols = df_sample.select_dtypes(include=["object"]).columns
            
            template_dict = {}
            for col in numeric_cols:
                template_dict[col] = float(df_sample[col].median())
            for col in object_cols:
                template_dict[col] = str(df_sample[col].mode().iloc[0] if not df_sample[col].empty else "")
            
            self.template_row = pd.DataFrame([template_dict])
        else:
            self.template_row = pd.DataFrame([{"project_id": "TEMPLATE-01"}])

    def score_raw_proposal(self, proposal: Dict[str, Any]) -> Dict[str, Any]:
        """Score an incoming unseen MPLADS work proposal in-memory using all 8 production models."""
        t0 = time.time()
        proposal_id = str(proposal.get("project_id") or f"PROP-{int(time.time() * 1000) % 1000000:06d}")
        
        sanctioned_amount = float(proposal.get("sanctioned_amount", 2500000.0) or 0.0)
        estimated_cost_raw = proposal.get("estimated_cost")
        if estimated_cost_raw is not None and float(estimated_cost_raw) > 0:
            estimated_cost = float(estimated_cost_raw)
            cost_verified = True
        else:
            estimated_cost = sanctioned_amount
            cost_verified = False
        tender_amount = float(proposal.get("tender_amount") or sanctioned_amount)
        duration_days = int(proposal.get("planned_duration_days", 180) or 180)
        category = str(proposal.get("category", "Public Infrastructure"))
        state = str(proposal.get("state", "National"))
        constituency = str(proposal.get("constituency", "Constituency"))
        work_name = str(proposal.get("work_name", "Public Infrastructure Work"))
        work_type = str(proposal.get("work_type", "Civil Infrastructure"))
        num_bidders = int(proposal.get("num_bidders", 3) or 3)
        is_single_bid = bool(proposal.get("is_single_bid", False) or num_bidders <= 1)
        contractor_delays = int(proposal.get("contractor_past_delays", 0) or 0)
        lat = float(proposal.get("latitude") or 26.1542)
        lon = float(proposal.get("longitude") or 85.8918)

        cost_dev = (sanctioned_amount - estimated_cost) / max(estimated_cost, 1.0)
        tender_dev = (tender_amount - estimated_cost) / max(estimated_cost, 1.0)
        is_structuring = (400000.0 <= sanctioned_amount < 500000.0)

        # 1. Assemble 1-row feature DataFrame with mapped domain attributes
        df_row = self.template_row.copy()
        df_row["project_id"] = proposal_id
        df_row["project__work_name"] = work_name
        df_row["project__category"] = category
        df_row["project__state_name"] = state
        df_row["project__constituency_name"] = constituency
        df_row["project__work_type"] = work_type
        df_row["project__planned_duration_days"] = duration_days
        df_row["project__project_latitude"] = lat
        df_row["project__project_longitude"] = lon
        df_row["financial__sanctioned_amount"] = sanctioned_amount
        df_row["financial__estimated_cost"] = estimated_cost
        df_row["financial__cost_per_unit"] = sanctioned_amount / max(duration_days, 30)

        # Financial domain features
        df_row["financial__cost_deviation"] = cost_dev
        df_row["financial__tender_estimate_deviation"] = tender_dev
        df_row["financial__actual_sanction_deviation"] = cost_dev
        df_row["financial__sor_deviation"] = cost_dev * 1.2
        df_row["financial__market_rate_deviation"] = cost_dev * 1.1
        df_row["financial__inflation_adjusted_cost_deviation"] = cost_dev

        # Procurement domain features
        df_row["procurement__tender_amount"] = tender_amount
        df_row["procurement__num_bidders"] = num_bidders
        df_row["procurement__bid_count"] = num_bidders
        df_row["procurement__qualified_bid_count"] = 1 if is_single_bid else max(1, num_bidders - 1)
        df_row["procurement__single_bid_flag"] = 1.0 if is_single_bid else 0.0
        df_row["procurement__single_bidder_flag"] = 1.0 if is_single_bid else 0.0
        df_row["procurement__bid_competition_score"] = 0.05 if is_single_bid else min(1.0, num_bidders / 5.0)
        df_row["procurement__winning_bid_amount"] = tender_amount
        df_row["procurement__winning_bid_deviation"] = tender_dev
        if is_single_bid:
            df_row["procurement__bid_price_similarity"] = 0.0
            df_row["procurement__repeated_winner_flag"] = 0.0
            df_row["procurement__procurement_compliance_flag"] = 1.0

        # Contractor domain features
        df_row["contract__contract_delay_days"] = contractor_delays * 60
        df_row["contractor__past_delayed_projects"] = contractor_delays
        df_row["contractor__contractor_previous_irregularities"] = contractor_delays
        df_row["contractor__past_irregularity_rate"] = min(1.0, contractor_delays * 0.25)
        df_row["contractor__contractor_delay_rate"] = min(1.0, contractor_delays * 0.25)
        if contractor_delays >= 2:
            df_row["contractor__contractor_agency_concentration"] = 0.88
            df_row["contractor__contractor_district_concentration"] = 0.85
            df_row["contractor__repeated_agency_contractor_pair"] = 1
            df_row["contract__contract_value_to_capacity"] = 3.5

        # Payment domain features (Statutory smurfing threshold)
        if is_structuring:
            df_row["payment__statutory_smurfing_score"] = 1.0

        # Progress domain features
        df_row["progress__planned_duration_days"] = duration_days
        if contractor_delays > 0 or duration_days > 300:
            df_row["progress__max_delay_days"] = contractor_delays * 45
            df_row["progress__duration_overrun_days"] = contractor_delays * 45
            df_row["progress__duration_overrun_ratio"] = min(2.0, (contractor_delays * 45) / max(duration_days, 1))
            df_row["progress__execution_stall_score"] = min(1.0, contractor_delays * 0.25)

        # 2. Evaluate Domain 1: Financial Model
        pids, _, fin_mat = self.financial_prep.transform(df_row)
        financial_score = round(float(self.financial_model.score(fin_mat)[0]), 2)
        if not cost_verified:
            financial_score = max(financial_score, 35.0)
        elif cost_dev > 0.50:
            financial_score = max(financial_score, min(96.0, 50.0 + cost_dev * 40.0))

        # 3. Evaluate Domain 2: Geospatial Model
        _, _, geo_mat = self.geospatial_prep.transform(df_row)
        geospatial_score = round(float(self.geospatial_model.score(geo_mat)[0]), 2)

        # 4. Evaluate Domain 3: Procurement Model
        p_res = self.procurement_prep.transform(df_row)
        proc_mat = p_res[2] if isinstance(p_res, tuple) else p_res
        procurement_score = round(float(self.procurement_model.score(proc_mat)[0]), 2)
        if is_single_bid:
            procurement_score = max(procurement_score, 35.0)

        # 5. Evaluate Domain 4: Contractor Model
        c_res = self.contractor_prep.transform(df_row)
        cont_mat = c_res[2] if isinstance(c_res, tuple) else c_res
        contractor_score = round(float(self.contractor_model.score(cont_mat)[0]), 2)
        if contractor_delays >= 3:
            contractor_score = max(contractor_score, 95.0)
        elif contractor_delays >= 1:
            contractor_score = max(contractor_score, 65.0)

        # 6. Evaluate Domain 5: Payment Model
        pay_res = self.payment_prep.transform(df_row)
        pay_mat = pay_res[2] if isinstance(pay_res, tuple) and len(pay_res) == 3 else (pay_res if not isinstance(pay_res, tuple) else pay_res[0])
        pay_raw = -float(self.payment_model.decision_function(pay_mat)[0])
        p_span = self.payment_bounds["max"] - self.payment_bounds["min"]
        payment_score = round(float(np.clip((pay_raw - self.payment_bounds["min"]) / max(p_span, 1e-6) * 100.0, 0.0, 100.0)), 2)
        if is_structuring:
            payment_score = max(payment_score, 40.0)

        # 7. Evaluate Domain 6: Progress Model
        prog_res = self.progress_prep.transform(df_row)
        prog_mat = prog_res[2] if isinstance(prog_res, tuple) and len(prog_res) == 3 else (prog_res if not isinstance(prog_res, tuple) else prog_res[0])
        prog_raw = -float(self.progress_model.decision_function(prog_mat)[0])
        pr_span = self.progress_bounds["max"] - self.progress_bounds["min"]
        progress_score = round(float(np.clip((prog_raw - self.progress_bounds["min"]) / max(pr_span, 1e-6) * 100.0, 0.0, 100.0)), 2)
        if contractor_delays >= 3:
            progress_score = max(progress_score, 70.0)

        # 8. Evaluate Domain 7: Graph Model (Run actual graph model on features)
        g_res = self.graph_prep.transform(df_row)
        g_mat = g_res[2] if isinstance(g_res, tuple) and len(g_res) == 3 else (g_res if not isinstance(g_res, tuple) else g_res[0])
        g_raw = -float(self.graph_model.decision_function(g_mat)[0])
        g_span = self.graph_bounds["max"] - self.graph_bounds["min"]
        graph_score = round(float(np.clip((g_raw - self.graph_bounds["min"]) / max(g_span, 1e-6) * 100.0, 0.0, 100.0)), 2)
        if is_single_bid:
            graph_score = max(graph_score, 25.0)
        if contractor_delays >= 2:
            graph_score = max(graph_score, 35.0)

        domain_scores = {
            "financial_anomaly_score": financial_score,
            "geospatial_anomaly_score": geospatial_score,
            "procurement_anomaly_score": procurement_score,
            "contractor_anomaly_score": contractor_score,
            "payment_anomaly_score": payment_score,
            "progress_anomaly_score": progress_score,
            "graph_anomaly_score": graph_score,
        }

        # Dynamic Reason Traces from domain signals
        domain_reasons: Dict[str, List[str]] = {
            "financial_anomaly_score": [
                f"Technical cost estimate not provided. Sanctioned allocation ₹{sanctioned_amount:,.0f} cannot be verified against PWD Schedule of Rates benchmark."
                if not cost_verified
                else (
                    f"Proposed fund allocation of ₹{sanctioned_amount:,.0f} exceeds technical cost estimate of ₹{estimated_cost:,.0f} by {cost_dev*100:.1f}%"
                    if cost_dev > 0.15 else f"Proposed fund allocation of ₹{sanctioned_amount:,.0f} shows deviation from category benchmark"
                )
            ] if financial_score >= 35.0 else [],
            "geospatial_anomaly_score": [
                f"Project site ({lat:.4f}, {lon:.4f}) indicates isolated execution footprint or local density anomaly"
            ] if geospatial_score >= 40.0 else [],
            "procurement_anomaly_score": [
                "Non-competitive single-bid tender recorded, flagged for review under GFR guidelines" if is_single_bid
                else f"Low bidder competition detected ({num_bidders} bidders recorded)"
            ] if procurement_score >= 35.0 else [],
            "contractor_anomaly_score": [
                f"Proposed contractor has {contractor_delays} prior recorded project delays and elevated irregularity rate"
                if contractor_delays > 0 else "Contractor-agency pairing concentration exceeds safe institutional threshold"
            ] if contractor_score >= 40.0 else [],
            "payment_anomaly_score": [
                f"Contract amount (₹{sanctioned_amount:,.0f}) structured just below statutory ₹5 Lakh e-tender threshold (smurfing audit flag)"
                if is_structuring else "Projected payment release timeline triggers structuring audit threshold"
            ] if payment_score >= 40.0 else [],
            "progress_anomaly_score": [
                f"Planned duration of {duration_days} days with {contractor_delays} contractor delays indicates high stall risk"
                if contractor_delays > 0 else f"Planned duration of {duration_days} days deviates from standard execution velocity"
            ] if progress_score >= 40.0 else [],
            "graph_anomaly_score": [
                "Entity graph relationship identifies recurring exclusive agency-contractor pairing"
                if contractor_delays >= 2 else (
                    "Single-bid award evaluated against constituency procurement network"
                    if is_single_bid else "Entity co-occurrence density exhibits concentrated network clustering"
                )
            ] if graph_score >= 40.0 else [],
        }

        # 9. Form Supervised Feature Vector & Calibrate Probability
        def score_to_empirical_percentile(s: float) -> float:
            if s >= 85.0: return 98.5
            if s >= 70.0: return 95.0
            if s >= 55.0: return 88.0
            if s >= 40.0: return 75.0
            if s >= 25.0: return 50.0
            return 20.0

        domain_pcts = {k.replace("_score", "_percentile"): score_to_empirical_percentile(v) for k, v in domain_scores.items()}
        all_domain_vals = list(domain_scores.values())
        max_score = float(max(all_domain_vals))
        mean_score = float(np.mean(all_domain_vals))
        std_score = float(np.std(all_domain_vals))
        num_flagged = int(sum(1 for s in domain_pcts.values() if s >= 95.0))

        supervised_features_dict = {
            "project_id": proposal_id,
            "financial_anomaly_score": financial_score,
            "geospatial_anomaly_score": geospatial_score,
            "procurement_anomaly_score": procurement_score,
            "contractor_anomaly_score": contractor_score,
            "payment_anomaly_score": payment_score,
            "progress_anomaly_score": progress_score,
            "graph_anomaly_score": graph_score,
            "max_anomaly_score": max_score,
            "mean_anomaly_score": mean_score,
            "std_anomaly_score": std_score,
            "num_flagged_models": num_flagged,
            "project__planned_duration_days": duration_days,
            "project_size_code": 2 if sanctioned_amount > 5000000 else (1 if sanctioned_amount > 1000000 else 0),
            "geo__population_density": float(df_row.get("geo__population_density", [800.0])[0] if "geo__population_density" in df_row else 800.0),
            "geo__infrastructure_gap_index": float(df_row.get("geo__infrastructure_gap_index", [0.45])[0] if "geo__infrastructure_gap_index" in df_row else 0.45),
            "financial__sanctioned_amount": sanctioned_amount,
            **domain_pcts
        }

        sup_df = pd.DataFrame([supervised_features_dict])
        sup_mat = self.supervised_prep.transform(sup_df)
        sup_proba = self.supervised_model.predict_proba(sup_mat)
        fraud_probability = round(float(sup_proba[0][1]), 4)

        # 10. Multi-Signal Fusion Engine
        # Determine archetype from highest domain
        highest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
        typology_map = {
            "financial_anomaly_score": "COST_OVERRUN",
            "geospatial_anomaly_score": "SPATIAL_OUTLIER",
            "procurement_anomaly_score": "SINGLE_BID_TENDER",
            "contractor_anomaly_score": "VENDOR_CONCENTRATION",
            "payment_anomaly_score": "PAYMENT_STRUCTURING",
            "progress_anomaly_score": "DELAYED_WORK",
            "graph_anomaly_score": "COLLUSION_RING",
        }
        candidate_typology = typology_map.get(highest_domain, "NORMAL") if max_score >= 50.0 else "NORMAL"

        fused = self.fusion_engine.fuse_project(
            project_id=proposal_id,
            domain_scores=domain_scores,
            domain_reasons=domain_reasons,
            fraud_probability=fraud_probability,
            predicted_typology=candidate_typology,
        )

        overall_risk_score = float(fused["overall_risk_score"])
        risk_level = str(fused["risk_level"])
        investigation_priority = str(fused["investigation_priority"])

        # Determine administrative approval recommendation
        if risk_level == "CRITICAL" or overall_risk_score >= 80.0:
            recommendation = "REJECT_AND_INVESTIGATE"
        elif risk_level == "HIGH" or overall_risk_score >= 60.0:
            recommendation = "MANDATORY_TECHNICAL_AUDIT"
        elif risk_level == "MEDIUM" or overall_risk_score >= 40.0:
            recommendation = "CONDITIONAL_APPROVAL"
        else:
            recommendation = "AUTOMATIC_CLEARANCE"

        elapsed_ms = round((time.time() - t0) * 1000.0, 2)

        return {
            "proposal_id": proposal_id,
            "overall_risk_score": overall_risk_score,
            "risk_level": risk_level,
            "investigation_priority": investigation_priority,
            "primary_typology": fused["primary_typology"],
            "fraud_probability": fraud_probability,
            "approval_recommendation": recommendation,
            "sub_scores": {
                "financial": financial_score,
                "geospatial": geospatial_score,
                "procurement": procurement_score,
                "contractor": contractor_score,
                "payment": payment_score,
                "progress": progress_score,
                "graph": graph_score,
                "ml_fraud_probability": round(fraud_probability * 100.0, 1),
            },
            "synthesized_reasons": fused["synthesized_reasons"],
            "primary_reason": fused["primary_reason"],
            "secondary_reason": fused.get("secondary_reason") or "",
            "inference_time_ms": elapsed_ms,
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
        }
