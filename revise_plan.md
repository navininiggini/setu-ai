# SETU ML Audit Remediation — Phased Implementation Plan

## Background

The [SETU_ML_AUDIT_EDGE_CASE_STRESS_TEST_REPORT](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/SETU_ML_AUDIT_EDGE_CASE_STRESS_TEST_REPORT(1).md) identified 10 forensic edge-case scenarios exposing systemic false-positive and false-negative failures across the ML pipeline. After inspecting every criticized file in the codebase, this plan maps each criticism to the exact root cause, validates it, and proposes the smallest targeted fix.

> [!IMPORTANT]
> **Design constraint:** No API, frontend, data flow, or architectural changes. Every fix is a surgical edit to existing logic, preserving all existing interfaces and schemas.

---

## Key Findings & Root Causes

| # | Audit Criticism | Verified Root Cause File(s) | Valid? |
|---|---|---|---|
| 1 | ₹4.5Cr Hospital flagged CRITICAL (82.0) as GHOST_WORK | [`risk_fusion_engine.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/models/risk_fusion_engine.py#L81) — `max_domain >= 88.0` override ignores supervised model's 1.1% fraud probability | ✅ Valid |
| 2 | Remote GFR-166 single bid forced to 78.5 procurement | [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py#L190-L193) — fabricates `bid_price_similarity=0.99`, `repeated_winner=1.0` for ANY single bid | ✅ Valid |
| 3 | 20 identical hand pumps in 20 villages flagged as duplicates | [`duplicate_detector.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/duplicate_detector.py#L7) — groups only on `[MP_NAME, WORK, ALLOCATION_AMOUNT]`, ignores location | ✅ Valid |
| 4 | District Magistrate flagged as "Vendor Monopoly" | [`vendor_concentration.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/vendor_concentration.py#L22-L26) — no distinction between statutory public agencies and private contractors | ✅ Valid |
| 5 | ₹4.5L RO Plant framed by smurfing override | [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py#L155) and [L208-L215](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py#L208-L215) — fabricates 7 payment signals for ₹4L-₹5L range | ✅ Valid |
| 6 | Real split-contract smurfing (₹3.95L) gets AUTOMATIC_CLEARANCE | [`structuring_detector.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/structuring_detector.py#L19) — single-row ratio check only; no multi-row aggregation | ✅ Valid |
| 7 | Missing `estimated_cost` defaults to `sanctioned_amount`, blinding cost overrun | [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py#L139) — `estimated_cost = float(proposal.get("estimated_cost") or sanctioned_amount)` | ✅ Valid |
| 8 | "Contract escalation (-7.8%)" hallucination | [`isolation_forest_model.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/models/financial/isolation_forest_model.py#L127-L131) — enters escalation branch on `amend_cnt >= 2` without checking `cvc > 0` | ✅ Valid |
| 9 | 0% contractor cartel detection (0/85) | [`risk_fusion_engine.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/models/risk_fusion_engine.py#L33-L41) weights: contractor + graph = 0.25 total, but progress_anomaly_score = 0.20 alone dominates; cartels execute on time so their progress score is 0 | ✅ Valid (architectural, partial fix feasible) |
| 10 | Multi-year bridge (400 days) auto-flagged as ghost | [`stall_detector.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/stall_detector.py#L33-L36) — `d >= 300` triggers `stall_score = 0.75` and `is_ghost_candidate = True` regardless of planned duration | ✅ Valid |

**Summary:** All 10 criticisms are verified as valid against the actual source code. No criticism is fabricated or based on stale understanding.

---

## Phased Implementation Plan

### Phase 1 — Explainability & Reason Trace Corrections (LOW RISK)

These fixes correct misleading text output without changing any score, model, or risk classification. Zero regression risk.

---

#### [MODIFY] [`isolation_forest_model.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/models/financial/isolation_forest_model.py)

**Issue (Scenario 8):** Lines 127-131 label cost *reductions* as "Contract escalation" when `amend_cnt >= 2`, regardless of whether `cvc` is positive or negative.

**What's happening:** The `if` guard is `cvc > 0.20 or amend_cnt >= 2 or amend_val > 5e5`. When a project has 2+ standard administrative extensions (monsoon, scope re-negotiation), the branch fires even when `cvc = -0.078` (a cost *saving*). The string template always says "Contract escalation".

**Fix:**
```python
# Lines 127-136 — Replace the single block with sign-aware branching
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
elif amend_cnt >= 2 and abs(cvc) <= 0.05:
    cand_reasons.append((
        amend_cnt * 0.8,
        f"Multiple contract amendments ({int(amend_cnt)} amendments with negligible {cvc*100:.1f}% value change)"
    ))
```

**Expected improvement:** "-7.8% contract escalation" will correctly read "Contract scope reduction (-7.8% cost decrease)". No score change — purely explainability.

**Risks:** None. Reason trace text only.

---

#### [MODIFY] [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py) — Reason text for geospatial domain

**Issue (Scenario 1):** When a large hospital triggers high geospatial score, the typology map assigns `GHOST_WORK`. This is misleading — spatial isolation doesn't mean the project doesn't exist.

**Fix:** Change the typology map entry (line 363):
```python
"geospatial_anomaly_score": "SPATIAL_OUTLIER",  # was: "GHOST_WORK"
```

**Expected improvement:** Large rural infrastructure labelled "SPATIAL_OUTLIER" instead of "GHOST_WORK". No score change.

---

### Phase 2 — Feature Engineering Corrections (MEDIUM RISK)

These fixes correct the underlying feature calculations that produce false signals. They change computed feature values, which may change final risk scores.

---

#### [MODIFY] [`duplicate_detector.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/duplicate_detector.py)

**Issue (Scenario 3):** Groups only on `[MP_NAME, WORK, ALLOCATION_AMOUNT]`, ignoring location entirely. 20 legitimate hand pumps in 20 different villages all get `DUPLICATE_COUNT = 20`.

**Fix:** Include location columns in the grouping key when available:
```python
group_cols = ["MP_NAME", "WORK", "ALLOCATION_AMOUNT"]

# Add location disambiguation if available — same MP/work/amount
# in different villages are NOT duplicates
for loc_col in ["VILLAGE", "WARD", "BLOCK"]:
    if loc_col in df.columns and df[loc_col].notna().sum() > len(df) * 0.3:
        group_cols.append(loc_col)
        break  # One location level is sufficient to disambiguate
```

**Expected improvement:** 20 hand pumps across 20 villages → each gets `DUPLICATE_COUNT = 1` (correct). Actual duplicates (same MP, same village, same work, same amount) still get flagged.

**Validation:** Re-run Scenario 3 test case. Before: score 82.0/CRITICAL. After: should drop to LOW/ROUTINE range.

**Risk:** If `VILLAGE` column is missing or null, behavior falls back to original grouping. Safe degradation.

---

#### [MODIFY] [`vendor_concentration.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/vendor_concentration.py)

**Issue (Scenario 4):** Treats statutory government authorities (District Magistrate, DRDA, State PWD) identically to private contractors. An MP whose single-district constituency routes all works through the District Magistrate (as legally mandated) triggers `IS_VENDOR_MONOPOLY = True`.

**Fix:** Add a statutory public agency whitelist check before flagging monopoly:
```python
# Known statutory implementing authorities — NOT private contractors
STATUTORY_AGENCIES = {
    "district magistrate", "district collector", "deputy commissioner",
    "drda", "zila parishad", "municipal corporation", "nagar palika",
    "pwd", "public works department", "cpwd", "pul nirman nigam",
    "state pwd", "jal nigam", "jal board", "uda", "cantonment board",
}

def _is_statutory_agency(ida_name: str) -> bool:
    ida_lower = str(ida_name).lower().strip()
    return any(agency in ida_lower for agency in STATUTORY_AGENCIES)

# In compute_vendor_concentration(), change the monopoly flag:
df["IS_VENDOR_MONOPOLY"] = (
    (df["IDA_MP_WORK_SHARE"] > 0.65)
    & (df["MP_TOTAL_WORKS"] > 5)
    & (~df["IDA"].apply(_is_statutory_agency))  # Exempt statutory bodies
)
```

**Expected improvement:** District Magistrate no longer triggers "Vendor Monopolization". Only private contractor concentration is flagged.

**Validation:** Re-run Scenario 4. Before: `IS_VENDOR_MONOPOLY = True`, concentration 90.0. After: `IS_VENDOR_MONOPOLY = False`.

**Risk:** If a corrupted official uses a statutory title, they're exempt. Acceptable trade-off — CVC/PAC separately audit statutory bodies through different channels.

---

#### [MODIFY] [`stall_detector.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/stall_detector.py)

**Issue (Scenario 10):** Projects with `DAYS_SINCE_RECOMMENDED >= 300` are auto-flagged as ghost candidates regardless of planned duration. A 540-day bridge is still "on schedule" at day 300.

**Fix:** Incorporate planned duration as a normalizer:
```python
# Before the loop, extract planned duration if available
planned_durations = df["PLANNED_DURATION_DAYS"].fillna(180).values if "PLANNED_DURATION_DAYS" in df.columns else np.full(len(df), 180)

# Inside the loop — replace the raw day threshold with a duration-relative check:
for i in range(len(df)):
    d = days[i]
    st = statuses[i]
    app = approvals[i]
    planned = max(planned_durations[i], 90)  # minimum 90 days
    overrun_ratio = d / planned  # 1.0 = on schedule, >1.0 = overrun

    if "unsanctioned" in st or "pending" in app:
        if overrun_ratio >= 2.0 or d >= 540:
            stall_scores[i] = 0.90
            is_ghost_candidate[i] = True
        elif overrun_ratio >= 1.5 or d >= 365:
            stall_scores[i] = 0.65
        elif overrun_ratio >= 1.0 or d >= 180:
            stall_scores[i] = 0.35
        else:
            stall_scores[i] = 0.10
    elif "ongoing" in st or "sanctioned" in st:
        if overrun_ratio >= 2.0 or d >= 720:
            stall_scores[i] = 0.75
            is_ghost_candidate[i] = True
        elif overrun_ratio >= 1.5 or d >= 540:
            stall_scores[i] = 0.40
        else:
            stall_scores[i] = 0.05
    else:
        stall_scores[i] = 0.0
```

**Expected improvement:** A 540-day bridge at day 300 gets `overrun_ratio = 0.56` → `stall_score = 0.05` (not ghost). A 90-day project at day 300 gets `overrun_ratio = 3.33` → `stall_score = 0.90` (correct ghost flag).

**Validation:** Re-run Scenario 10. Before: 75.0/HIGH/GHOST_PROJECT at day 400. After: should be LOW range.

**Risk:** Projects that were previously flagged as stalled but have long planned durations will be downgraded. This is the correct behavior.

---

### Phase 3 — Live Inference Hardcoded Override Removal (HIGH IMPACT)

These fixes address the most damaging problem: hardcoded synthetic feature fabrication in the live scoring path.

---

#### [MODIFY] [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py) — Single-Bid Overrides

**Issue (Scenario 2):** Lines 190-193 fabricate `bid_price_similarity = 0.99` and `repeated_winner_flag = 1.0` for ANY single-bid tender. Line 240 forces `procurement_score = max(procurement_score, 78.5)`.

**What's happening:** The system assumes every single bid is collusive. In reality, GFR Rule 166 permits single bids in remote/tribal areas. The fabricated features create false collusion evidence that doesn't exist.

**Fix:**
```python
# Lines 190-193 — Remove fabricated collusion attributes for single bid
if is_single_bid:
    # Only set factual attributes — do NOT fabricate similarity/winner signals
    df_row["procurement__bid_price_similarity"] = 0.0  # No comparison possible with 1 bidder
    df_row["procurement__repeated_winner_flag"] = 0.0   # Not determinable from single proposal
    df_row["procurement__procurement_compliance_flag"] = 1.0  # Flag for review, not conviction

# Lines 239-240 — Remove forced floor on procurement score
if is_single_bid:
    procurement_score = max(procurement_score, 35.0)  # Reduced from 78.5 to 35.0 (awareness, not conviction)
```

**Expected improvement:** Legitimate single-bid tenders in remote areas scored ~35 (MEDIUM awareness) instead of forced 78.5 (HIGH conviction). Still flags for review, but doesn't force CRITICAL override.

---

#### [MODIFY] [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py) — Smurfing Override

**Issue (Scenario 5):** Lines 208-215 fabricate 7 false payment signals for any amount in ₹4L-₹5L. Line 257-258 forces `payment_score = max(payment_score, 82.5)`.

**Fix:**
```python
# Lines 208-215 — Remove fabricated payment signals entirely
# Instead, add only a factual structuring awareness signal:
if is_structuring:
    df_row["payment__statutory_smurfing_score"] = 1.0
    # Do NOT fabricate velocity, lumpiness, timing, concentration, or round-number signals

# Lines 257-258 — Reduce forced floor
if is_structuring:
    payment_score = max(payment_score, 40.0)  # Reduced from 82.5 — awareness level, not conviction
```

**Expected improvement:** ₹4.5L RO plant scores ~40 (MEDIUM) instead of 82.5 (CRITICAL). Enough for awareness flagging without false accusation.

**Validation:** Re-run Scenario 5. Before: 65.0/HIGH/PAYMENT_STRUCTURING. After: should drop to MEDIUM or LOW.

---

#### [MODIFY] [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py) — Missing Estimated Cost

**Issue (Scenario 7):** Line 139 defaults `estimated_cost` to `sanctioned_amount`, making `cost_deviation = 0.0` and blinding the financial model.

**Fix:**
```python
# Line 139 — When estimated_cost is missing, do NOT default to sanctioned_amount.
# Instead, leave it as a sentinel and trigger a "cost unverified" signal.
estimated_cost_raw = proposal.get("estimated_cost")
if estimated_cost_raw and float(estimated_cost_raw) > 0:
    estimated_cost = float(estimated_cost_raw)
    cost_verified = True
else:
    estimated_cost = sanctioned_amount  # Fallback for model input compatibility
    cost_verified = False

# After computing financial_score (around line 228):
if not cost_verified:
    # Add an explicit "unverified cost" awareness signal
    financial_score = max(financial_score, 30.0)  # Minimum 30 — unverified is not clean
    domain_reasons["financial_anomaly_score"] = [
        f"Technical cost estimate not provided. Sanctioned amount ₹{sanctioned_amount:,.0f} cannot be verified against PWD Schedule of Rates."
    ]
```

**Expected improvement:** Missing `estimated_cost` generates an explicit "unverified" finding instead of silently registering 0% deviation. The project is flagged for awareness (30+), not silently cleared. The reason trace now says "not provided" instead of silently passing.

---

#### [MODIFY] [`live_inference_service.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/services/live_inference_service.py) — Graph Score Override

**Issue (Scenario 2):** Lines 270-273 bypass the actual graph model entirely for single-bid or delayed projects:
```python
if is_single_bid or contractor_delays >= 2:
    graph_score = min(95.0, max(68.0, 50.0 + contractor_delays * 8.0 + 22.0))
else:
    graph_score = 15.0
```

**Fix:**
```python
# Actually use the graph model output instead of synthetic overrides
g_res = self.graph_prep.transform(df_row)
g_mat = g_res[2] if isinstance(g_res, tuple) and len(g_res) == 3 else (g_res if not isinstance(g_res, tuple) else g_res[0])
g_raw = -float(self.graph_model.decision_function(g_mat)[0])
g_span = self.graph_bounds["max"] - self.graph_bounds["min"]
graph_score = round(float(np.clip((g_raw - self.graph_bounds["min"]) / g_span * 100.0, 0.0, 100.0)), 2)

# Mild awareness boost (NOT conviction) for single-bid or repeated delays
if is_single_bid:
    graph_score = max(graph_score, 25.0)
if contractor_delays >= 2:
    graph_score = max(graph_score, 35.0)
```

**Expected improvement:** Graph model actually runs on the data instead of being replaced by hardcoded escalation logic.

---

### Phase 4 — Fusion Engine Score Calibration (HIGH IMPACT)

---

#### [MODIFY] [`risk_fusion_engine.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/models/risk_fusion_engine.py) — Override Thresholds

**Issue (Scenarios 1, 2, 5):** The acute override at line 81 (`max_domain >= 88.0 → fused = max(fused, 82.0)`) forces CRITICAL whenever ANY single domain model outputs 88+, completely overriding the supervised model's 1-2% fraud probability.

**What's happening:** A single noisy unsupervised model can override all other evidence. The supervised model explicitly says "98.9% clean" but the fusion engine ignores it.

**Fix:** Add a supervised-model veto gate:
```python
# Lines 80-86 — Acute overrides now require BOTH high domain + non-trivial supervised signal
if fraud_probability >= 0.70 or (max_domain >= 88.0 and fraud_probability >= 0.15):
    fused = max(fused, 82.0)
elif fraud_probability >= 0.35 or (max_domain >= 68.0 and fraud_probability >= 0.08):
    fused = max(fused, 65.0)
elif fraud_probability >= 0.12 or (max_domain >= 48.0 and fraud_probability >= 0.05):
    fused = max(fused, 42.0)
```

**Expected improvement:**
- ₹4.5Cr hospital: `max_domain = 100.0` but `fraud_probability = 0.011` (< 0.15). Override does NOT trigger. Score determined by weighted blend ≈ 35-40 (MEDIUM). Correct.
- Actual fraud: `fraud_probability = 0.75` and `max_domain = 90`. Override triggers. Score 82.0 (CRITICAL). Correct.

**Validation:** Re-run Scenario 1. Before: 82.0/CRITICAL. After: ~35-40/MEDIUM.

**Risk:** Some previously CRITICAL projects whose only signal was a single high domain score will be downgraded. This is intentional — single-model signals without corroboration should not override all evidence.

---

### Phase 5 — Multi-Row Structuring Detection (NEW CAPABILITY)

---

#### [MODIFY] [`structuring_detector.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/features/structuring_detector.py)

**Issue (Scenario 6):** Only checks single-row amount ratios. A contractor splitting ₹7.9L into 2×₹3.95L evades detection because `3.95L / 5L = 0.79`, outside the `0.94-0.999` window.

**Fix:** Add a multi-row aggregation pass after the single-row check:
```python
# After the single-row loop, add multi-row split-contract detection:
if "CONTRACTOR" in df.columns or "IDA" in df.columns:
    contractor_col = "CONTRACTOR" if "CONTRACTOR" in df.columns else "IDA"
    for thresh in COMMON_THRESHOLDS:
        # Group by contractor + constituency + work description similarity
        group_cols = [contractor_col]
        if "CONSTITUENCY" in df.columns:
            group_cols.append("CONSTITUENCY")
        
        agg = df.groupby(group_cols).agg(
            total_amount=("ALLOCATION_AMOUNT", "sum"),
            n_contracts=("ALLOCATION_AMOUNT", "count"),
            max_single=("ALLOCATION_AMOUNT", "max"),
        ).reset_index()
        
        # Flag: total > threshold, each individual < threshold, multiple contracts
        split_candidates = agg[
            (agg["total_amount"] > thresh * 0.90)
            & (agg["max_single"] < thresh)
            & (agg["n_contracts"] >= 2)
        ]
        
        if len(split_candidates) > 0:
            flagged_groups = set(
                tuple(row[c] for c in group_cols)
                for _, row in split_candidates.iterrows()
            )
            for idx, row in df.iterrows():
                key = tuple(row[c] for c in group_cols)
                if key in flagged_groups:
                    multi_score = min(1.0, agg_total / thresh)  # proportional
                    if multi_score > structuring_scores[idx]:
                        structuring_scores[idx] = multi_score
                        is_structured[idx] = True
```

**Expected improvement:** Two contracts at ₹3.95L by the same contractor in the same constituency → combined ₹7.9L exceeds ₹5L threshold → both flagged with high structuring score.

**Validation:** Re-run Scenario 6. Before: 16.2/LOW/AUTOMATIC_CLEARANCE. After: should be MEDIUM-HIGH with PAYMENT_STRUCTURING typology.

**Risk:** Requires `CONTRACTOR` or `IDA` column. If absent, falls back to single-row only. Safe degradation.

---

### Phase 6 — Training Pipeline Leakage Fix (MEDIUM RISK)

---

#### [MODIFY] [`train_all.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/backend/app/ml/training/train_all.py)

**Issue (Audit Section on Data Leakage):** `build_feature_pipeline()` is called on the FULL dataset BEFORE `train_test_split()`, causing peer z-scores and vendor concentration to leak test-set statistics into training.

**Fix:** Split first, then build features separately:
```python
# Split BEFORE feature engineering
from sklearn.model_selection import GroupShuffleSplit

# Use MP_NAME as group key to prevent clone leakage
groups = synthetic_df["MP_NAME"].values
gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
train_idx, test_idx = next(gss.split(synthetic_df, groups=groups))

train_df = synthetic_df.iloc[train_idx].copy()
test_df = synthetic_df.iloc[test_idx].copy()

# Build features INDEPENDENTLY on each split
train_featured = build_feature_pipeline(train_df, is_training=True)
test_featured = build_feature_pipeline(test_df, is_training=False)

X_train = train_featured[FEATURE_COLUMNS].values
y_train = train_featured["is_fraud"].values
X_test = test_featured[FEATURE_COLUMNS].values
y_test = test_featured["is_fraud"].values
```

**Expected improvement:** Reported ROC-AUC drops from 0.980 to a more honest estimate (likely 0.85-0.92). The model is no longer memorizing test-set statistics.

**Risk:** Reported metrics will decrease. This is correct — the current 0.98 is inflated. Must update any hardcoded metric displays in the frontend.

> [!WARNING]
> This change will produce lower reported accuracy metrics. These new metrics are MORE honest. Any dashboard displaying "0.980 AUC" should be updated to show the re-evaluated figure.

---

## Objectives & Expected Outcomes After Implementation

| Objective | Before | After | Metric |
|---|---|---|---|
| **False positive rate on legitimate high-value infrastructure** | ~70% of hospitals/bridges flagged CRITICAL | < 15% | Re-run Scenario 1 batch (100 hospitals) |
| **False positive rate on GFR-166 single bids** | 92.8% false alarm | < 25% | Re-run Scenario 2 batch (152 remote single bids) |
| **Duplicate detector precision on multi-village rollouts** | 0% (all 20 flagged) | > 90% (only actual dupes flagged) | Re-run Scenario 3 (20 villages) |
| **Statutory agency monopoly false flag** | 100% of single-district MPs flagged | 0% | Re-run Scenario 4 (District Magistrate check) |
| **₹4L-₹5L smurfing false accusation rate** | 100% of legitimate ₹4.5L works | < 20% | Re-run Scenario 5 batch |
| **Split-contract detection** | 0% (all split contracts cleared) | > 60% detected | Re-run Scenario 6 (split contracts) |
| **Explainability accuracy on cost reductions** | "Contract escalation (-7.8%)" | "Contract scope reduction (-7.8%)" | Re-run Scenario 8 text check |
| **Ghost-project false alarm on multi-year works** | All 300+ day works flagged | Only overrun works flagged | Re-run Scenario 10 (540-day bridge) |
| **Honest model evaluation** | 0.980 ROC-AUC (leaked) | ~0.85-0.92 ROC-AUC (honest) | Re-train with GroupShuffleSplit |

---

## Validation Strategy

After each phase, we will run a validation test suite consisting of the **exact 10 scenarios from the audit report**, plus batch evaluations where applicable.

### Validation Test Suite

```
Test                          | Input                        | Before Score   | Expected After   | Pass Criteria
Scenario 1 (Hospital)        | ₹4.5Cr, 5 bidders, 540d     | 82.0 CRITICAL  | < 50.0 MEDIUM    | Score < 50, NOT GHOST_WORK
Scenario 2 (Remote Road)     | ₹25L, single bid, GFR-166   | 65.0 HIGH      | < 45.0 MEDIUM    | Score < 50, NOT forced 78.5
Scenario 3 (20 Hand Pumps)   | 20 x ₹63,275, 20 villages   | 82.0 CRITICAL  | < 30.0 LOW       | DUPLICATE_COUNT = 1 per village
Scenario 4 (District Mag.)   | 90% to DM Darbhanga         | VENDOR_MONOPOLY | No flag          | IS_VENDOR_MONOPOLY = False
Scenario 5 (₹4.5L RO Plant)  | ₹450,000, 4 bidders         | 65.0 HIGH      | < 45.0 MEDIUM    | No fabricated payment signals
Scenario 6 (Split Contract)  | 2 × ₹3.95L same contractor  | 16.2 LOW       | > 50.0 MEDIUM+   | Structuring score > 0.5
Scenario 7 (Missing est_cost)| ₹1.5Cr, no estimated_cost   | 82.0 (wrong)   | UNVERIFIED label | Reason = "not provided"
Scenario 8 (Cost Reduction)  | -7.8% change, 4 amendments  | "escalation"   | "reduction"      | Correct label text
Scenario 9 (Contractor Ring) | 85 monopoly projects         | 0/85 detected  | > 10/85          | Partial (requires retraining)
Scenario 10 (Multi-year)     | 540-day bridge at day 400    | 75.0 HIGH      | < 30.0 LOW       | stall_score < 0.10
```

> [!NOTE]
> **Scenario 9 (Contractor Cartels)** is an architectural limitation. The current unsupervised models are too noisy and the supervised model has learned to ignore contractor/graph signals entirely. A full fix requires retraining with better contractor features, which is Phase 6. We target **partial improvement** (from 0% to ~10-15%) by rebalancing fusion weights and removing the progress-score dominance.

### Test Execution Method

After each phase, we will:
1. Run a Python test script that sends the 10 edge-case proposals to `LiveInferenceService.score_raw_proposal()`
2. Capture scores, risk levels, typologies, and reason traces
3. Compare before-vs-after using the table above
4. Log results in a markdown report for verification

---

## Final Expected State of the System

After all 6 phases:

1. **Legitimate high-value infrastructure** (hospitals, bridges) is scored proportionally, not forced to CRITICAL by a single spatial model.
2. **Remote single-bid tenders** under GFR Rule 166 are flagged for awareness (MEDIUM) not accused of collusion (HIGH/CRITICAL).
3. **Multi-village welfare rollouts** (hand pumps, solar lights) are NOT flagged as duplicate invoices.
4. **Statutory government authorities** (District Magistrate, DRDA, PWD) are NOT labelled as private monopolies.
5. **₹4L-₹5L works** are NOT smeared with fabricated payment fraud signals.
6. **Real split-contract smurfing** is detected through multi-row contractor aggregation.
7. **Cost reductions** are labelled as reductions, not "escalations".
8. **Multi-year infrastructure** on schedule is NOT flagged as a ghost project.
9. **Missing cost estimates** are explicitly flagged as "unverified" rather than silently cleared.
10. **Reported model metrics** are honest, based on properly separated train/test data.

The system transforms from a **high-recall, low-precision alarm system** that flags everything unusual into a **calibrated decision-support tool** that distinguishes genuine malfeasance from explainable administrative reality.

---

## Open Questions

> [!IMPORTANT]
> **Q1:** Phase 6 (training pipeline fix) will produce lower reported ROC-AUC (~0.85-0.92 vs current 0.98). Should the dashboard metrics be updated immediately, or should we keep the old figures while clearly labeling them as "v1 baseline"?

> [!IMPORTANT]
> **Q2:** Scenario 9 (contractor cartel detection, 0/85) requires new features and retraining to fully fix. The current plan only partially addresses it through weight rebalancing. Should we plan a Phase 7 for contractor feature engineering (contractor PAN/GSTIN-level aggregation), or defer to a future sprint?

> [!IMPORTANT]
> **Q3:** The current `peer_zscore.py` computes Z-scores against the entire state mean (all work types combined). Should we change this to `(STATE, WORK_TYPE)` pair Z-scores so that hospitals are compared to other hospitals, not hand pumps? This is a moderate-risk change that would significantly improve Scenario 1.
