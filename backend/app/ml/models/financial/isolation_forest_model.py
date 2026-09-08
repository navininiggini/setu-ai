"""Financial Isolation Forest Anomaly Model.

Implements the standalone unsupervised Isolation Forest model, continuous score
normalization (0-100), percentile computation, flag thresholding, and reason trace generation.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest
import joblib

from .config import FinancialModelConfig


class FinancialIsolationForestModel:
    """SETU Financial Anomaly Isolation Forest Model."""

    def __init__(self, config: Optional[FinancialModelConfig] = None):
        self.config = config or FinancialModelConfig()
        self.model_: Optional[IsolationForest] = None
        self.raw_score_p1_: float = 0.0
        self.raw_score_p99_: float = 1.0
        self.is_fitted_: bool = False

    def fit(self, X: np.ndarray, feature_names: List[str]) -> "FinancialIsolationForestModel":
        """Train Isolation Forest on preprocessed matrix."""
        self.model_ = IsolationForest(
            n_estimators=self.config.n_estimators,
            contamination=self.config.contamination,
            random_state=self.config.random_state,
            max_samples=self.config.max_samples,
            bootstrap=self.config.bootstrap,
            n_jobs=self.config.n_jobs,
        )
        self.model_.fit(X)

        raw_anomaly = -self.model_.decision_function(X)
        self.raw_score_p1_ = float(np.percentile(raw_anomaly, 1.0))
        self.raw_score_p99_ = float(np.percentile(raw_anomaly, 99.0))
        if self.raw_score_p99_ <= self.raw_score_p1_:
            self.raw_score_p99_ = self.raw_score_p1_ + 1.0

        self.is_fitted_ = True
        return self

    def score(self, X: np.ndarray) -> np.ndarray:
        """Compute continuous normalized financial anomaly score in [0.0, 100.0]."""
        if not self.is_fitted_ or self.model_ is None:
            raise RuntimeError("Model must be fitted before scoring.")

        raw_anomaly = -self.model_.decision_function(X)
        norm_score = (raw_anomaly - self.raw_score_p1_) / (self.raw_score_p99_ - self.raw_score_p1_) * 100.0
        return np.clip(norm_score, 0.0, 100.0)

    def predict_percentile(self, scores: np.ndarray) -> np.ndarray:
        """Compute empirical percentile rank [0.0, 100.0] within the population."""
        return stats.rankdata(scores, method="average") / len(scores) * 100.0

    def predict_flags(self, percentiles: np.ndarray) -> np.ndarray:
        """Flag projects at or above anomaly percentile cutoff (e.g. >= 95th percentile)."""
        return percentiles >= self.config.anomaly_percentile_cutoff

    def generate_reason_traces(
        self,
        df_features: pd.DataFrame,
        scores: np.ndarray,
        percentiles: np.ndarray,
    ) -> pd.DataFrame:
        """Generate explainable, non-accusatory financial reason traces for every project."""
        reasons_list = []

        for idx in range(len(df_features)):
            row = df_features.iloc[idx]
            pct = percentiles[idx]
            cand_reasons = []

            # 1. Peer-adjusted cost deviation
            cost_z = row.get("peer__cost_work_type_robust_z", 0.0)
            cost_diff = row.get("peer__cost_diff_work_type_median", 0.0)
            cost_ratio = row.get("peer__cost_ratio_work_type_median", 1.0)
            if cost_z > 1.8 or cost_ratio > 1.30:
                pct_above = (cost_ratio - 1.0) * 100.0
                cand_reasons.append((
                    abs(cost_z) * 1.5,
                    f"Elevated peer-adjusted cost (+{pct_above:.1f}% vs peer median for work type)"
                ))
            elif cost_z < -1.8:
                cand_reasons.append((
                    abs(cost_z) * 1.2,
                    f"Substantial cost deficit vs peer median for work type ({cost_diff/1e5:.1f} Lakhs below median)"
                ))

            # 2. Cost per unit deviation
            unit_z = row.get("peer__unit_cost_work_type_robust_z", 0.0)
            unit_ratio = row.get("peer__unit_cost_ratio_work_type_median", 1.0)
            if unit_z > 1.8 or unit_ratio > 1.35:
                pct_above_unit = (unit_ratio - 1.0) * 100.0
                cand_reasons.append((
                    abs(unit_z) * 1.4,
                    f"Atypical cost per unit (+{pct_above_unit:.1f}% vs peer median rate)"
                ))

            # 3. Unverified payments
            unverified_rate = row.get("payment__unverified_payment_rate", 0.0)
            if unverified_rate > 0.0:
                cand_reasons.append((
                    unverified_rate * 5.0,
                    
                    f"High unverified disbursement rate ({unverified_rate*100:.1f}% unverified payments)"
                ))

            # 4. Payment velocity
            vel_z = row.get("peer__payment_velocity_work_type_robust_z", 0.0)
            vel_ratio = row.get("peer__payment_velocity_ratio_work_type_median", 1.0)
            if vel_z > 2.0 or vel_ratio > 2.0:
                cand_reasons.append((
                    vel_z * 1.3,
                    f"Accelerated disbursement velocity ({vel_ratio:.1f}x peer median disbursement speed)"
                ))

            # 5. Contract value change & amendments
            cvc = row.get("contract__contract_value_change", 0.0)
            amend_cnt = row.get("contract__contract_amendment_count", 0)
            amend_val = row.get("contract__amendment_value", 0.0)
            if cvc > 0.20 or (amend_cnt >= 2 and cvc > 0) or amend_val > 5e5:
                cand_reasons.append((
                    (cvc * 3.0) + (amend_cnt * 1.0),
                    f"Contract cost escalation (+{cvc*100:.1f}% value increase with {int(amend_cnt)} amendments)"
                ))
            elif cvc < -0.05 and amend_cnt >= 2:
                cand_reasons.append((
                    abs(cvc) * 1.5,
                    f"Contract scope reduction ({cvc*100:.1f}% cost decrease with {int(amend_cnt)} administrative amendments)"
                ))
            elif cvc < -0.20:
                cand_reasons.append((
                    abs(cvc) * 2.5,
                    f"Abrupt contract value contraction ({cvc*100:.1f}% reduction from original work order)"
                ))
            elif amend_cnt >= 2 and abs(cvc) <= 0.05:
                cand_reasons.append((
                    amend_cnt * 0.8,
                    f"Multiple contract amendments ({int(amend_cnt)} administrative amendments with negligible {cvc*100:.1f}% value change)"
                ))

            # 6. Payment timing / round-number anomalies
            timing_rate = row.get("payment__payment_timing_anomaly_rate", 0.0)
            round_rate = row.get("payment__round_number_payment_rate", 0.0)
            if timing_rate > 0.15:
                cand_reasons.append((
                    timing_rate * 3.0,
                    f"Irregular payment intervals ({timing_rate*100:.1f}% timing anomaly rate)"
                ))
            if round_rate > 0.30:
                cand_reasons.append((
                    round_rate * 2.5,
                    f"Disproportionate round-sum disbursements ({round_rate*100:.1f}% round-number rate)"
                ))

            # 7. Payment concentration
            conc_max = row.get("payment__payment_concentration_max", 0.0)
            if conc_max > 0.65:
                cand_reasons.append((
                    conc_max * 2.0,
                    f"High payment concentration ({conc_max*100:.1f}% in single installment)"
                ))

            # Sort candidate reasons by contribution weight
            cand_reasons.sort(key=lambda x: -x[0])

            r1 = cand_reasons[0][1] if len(cand_reasons) > 0 else "Financial metrics aligned with peer expectations"
            r2 = cand_reasons[1][1] if len(cand_reasons) > 1 else ("Normal peer disbursement pattern" if pct >= 50 else "Consistent contract execution")
            r3 = cand_reasons[2][1] if len(cand_reasons) > 2 else ("Standard schedule compliance" if pct >= 50 else "No significant deviation from SOR rates")

            reasons_list.append({
                "primary_reason": r1,
                "secondary_reason": r2,
                "tertiary_reason": r3,
            })

        return pd.DataFrame(reasons_list)

    def save(self, filepath: str) -> None:
        """Save model to disk."""
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "FinancialIsolationForestModel":
        """Load model from disk."""
        return joblib.load(filepath)
