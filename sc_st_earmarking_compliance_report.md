# SETU MPLADS Platform — SC/ST Earmarking Compliance Audit & Architectural Report

**Target Subject**: Statutory Compliance Enforcement for Scheduled Caste (SC) and Scheduled Tribe (ST) Earmarking under MPLADS Guidelines  
**Auditing Entity**: Senior ML Systems Architect & Public Procurement Code Auditor  
**Date**: September 2026  
**Reference Mandate**: MoSPI MPLADS Guidelines 2023 (Chapter 2, Para 2.5); GFR 2017; PAC Recommendations on Social Sub-Plans  

---

## 1. Executive Summary & Legal Statutory Mandate

Under the **Member of Parliament Local Area Development Scheme (MPLADS)** governed by the Ministry of Statistics and Programme Implementation (MoSPI), Government of India:

### 1.1 The Statutory Quota Mandate (Para 2.5)
To ensure targeted asset creation in historically marginalized and underdeveloped habitations, every Member of Parliament is legally obligated to allocate a mandatory proportion of their annual entitlement:
* **Scheduled Caste (SC) Habitations**: Minimum **15.0%** of annual entitlement (₹75.0 Lakhs per annum out of ₹5.00 Crore).
* **Scheduled Tribe (ST) Habitations**: Minimum **7.5%** of annual entitlement (₹37.5 Lakhs per annum out of ₹5.00 Crore).
* **Total Mandatory Social Inclusion Outlay**: **22.5%** (minimum **₹1.125 Crores** per MP annually).

### 1.2 Administrative Rules & Flexibility
1. **Constituency Nuance**: For Lok Sabha MPs whose constituencies possess negligible or zero Scheduled Tribe population, guidelines permit recommending ST works in other tribal districts within their State with the concurrence of the State Nodal Department and District Authority.
2. **Rajya Sabha MPs**: Rajya Sabha MPs represent an entire State and must ensure that their statewide project portfolio adheres to the aggregate 15% SC and 7.5% ST thresholds.
3. **Asset Tangibility**: Earmarked funds must be spent on durable public community assets—such as all-weather approach roads to SC/ST bastis, dedicated drinking water networks, Anganwadi/creche facilities, community hall infrastructure, and electrification—and cannot be diverted into administrative overheads or general urban commercial facilities.

---

## 2. Current State Assessment of SETU

An exhaustive audit of the SETU codebase reveals the current operational reality regarding SC/ST compliance:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CURRENT SETU PIPELINE                                   │
├──────────────────────┬────────────────────────┬────────────────────────────────────────┤
│ Layer                │ Status                 │ Audit Finding                          │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 1. Raw Data Scrapes  │ Partially Present      │ Scraped CSV contains (SC)/(ST) seat    │
│    (e-SAKSHI)        │ (12,819 works in CSV)  │ indicators and occasional ward tags.   │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 2. Relational DB     │ Absent in Schema       │ setu_mplads.db lacks columns for       │
│    (setu_mplads.db)  │ (0 SC/ST fields)       │ beneficiary type or quota tallies.     │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 3. ML Risk Engine    │ Not Integrated         │ 8 models evaluate financial, cartel,   │
│    (RiskFusionEngine)│ (0 SC/ST penalty)      │ & stall risks, but not quota deficits. │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 4. RAG Knowledge     │ Missing Rule           │ Encodes GFR 149/154/155/161/173 &      │
│    (knowledge_base)  │                        │ Calamity, but lacks Para 2.5 Mandate.  │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 5. UI & Dashboard    │ Absent                 │ Works Explorer & Dashboard lack quota  │
│    (Frontend)        │                        │ compliance barometers / SC/ST filters. │
└──────────────────────┴────────────────────────┴────────────────────────────────────────┘
```

### 2.1 Raw Data Layer vs. Processed Database
* **Raw e-SAKSHI Dataset (`MPLADS_cleaned_featured.csv`)**:
  * 60,354 total raw projects contain parliamentary constituency tags like `KARAULI-DHOLPUR(SC)`, `GOPALGANJ (SC)`, `RATLAM(ST)`, `KORAPUT(ST)` across **107 reserved constituencies** (12,819 individual project records).
  * A small subset of records feature ward/work descriptors such as *"Scheduled Caste Public Places"* or *"Tribal Hamlet Connectivity"*.
* **Active Working SQLite Database (`backend/setu_mplads.db`)**:
  * The `works` table schema contains: `id`, `mp_name`, `work`, `category`, `state`, `constituency`, `ida`, `allocation_amount`, `risk_score`, `sub_scores`, etc.
  * **Critical Gap**: The schema currently does **not** have dedicated fields such as `is_sc_earmarked`, `is_st_earmarked`, or `beneficiary_community`.
  * The `constituencies` table records total works and outlays, but does not track reserved status `(SC/ST/GEN)` or percentage of mandatory earmark achieved.

### 2.2 Machine Learning & Risk Scoring Engine
* The 8 operational models in SETU focus exclusively on:
  1. Financial outlier detection (Isolation Forest)
  2. Geospatial density & spatial anomalies (DBSCAN + Haversine)
  3. Procurement irregularities (GFR Rule 155 quotation splitting, single-bid tenders)
  4. Contractor capacity & corporate collusion
  5. Payment velocity & unverified disbursement bursts
  6. Physical milestone vs. financial progress stalling
  7. Graph network collusion (shared directors, repeated pairing)
  8. Supervised XGBoost fraud classification
* **Compliance Limitation**: If an MP allocates **0%** of their ₹5 Crore entitlement to SC/ST habitations, the current system gives them a clean bill of health on that front, because earmarking non-compliance is **not currently coded as a risk feature or statutory override**.

### 2.3 RAG Knowledge Base & Regulatory Compendium
* In `backend/app/ml/rag/knowledge_base.py`, SETU codifies:
  * `GFR_RULE_149`: GeM procurement threshold
  * `GFR_RULE_154`: Direct purchase under ₹25,000
  * `GFR_RULE_155`: Local Purchase Committee under ₹5 Lakhs
  * `GFR_RULE_161`: Open e-tendering above ₹5 Lakhs
  * `GFR_RULE_173`: Single-bid / Proprietary Article Certificate
  * `MPLADS_2023_ELIGIBILITY`: Permissible vs. prohibited assets
  * `MPLADS_2023_CALAMITY`: Disaster relief Para 3.2
* **Statutory Gap**: `MPLADS_2023_SC_ST_EARMARK` (Para 2.5) is currently absent from the dictionary of statutory rules and hard-negative evaluation logic.

---

## 3. Real-World Audit Risks of Quota Non-Compliance

In central PAC (Public Accounts Committee) and Comptroller and Auditor General (CAG) performance audits of MPLADS:
1. **Adverse Audit Paras**: The most common adverse audit observation against District Authorities and Nodal Departments is the **diversion or lapse of SC/ST earmarked allocations**.
2. **Disbursement Sanction Hold**: MoSPI circulars mandate that subsequent installment releases (the second ₹2.5 Crore tranche) require an explicit Utilization Certificate (UC) demonstrating proportional expenditure in SC and ST earmarked zones.
3. **Misclassification Smurfing**: When MPs fall short of the 22.5% threshold towards the end of a financial year, there is a recurring tendency to retroactively reclassify general village street lighting or boundary walls as "SC/ST welfare" to evade audit objections.

---

## 4. End-to-End Implementation Blueprint: Integrating SC/ST Compliance

To bring SETU into complete alignment with statutory MoSPI guidelines, the following 4-phase enhancement should be executed:

### Phase A: Schema & Data Pipeline Enhancement
1. **Update `Work` Model (`backend/app/models/work.py`)**:
   ```python
   # Add statutory earmarking metadata
   beneficiary_type = Column(String(50), default="GENERAL") # "GENERAL", "SC_HABITATION", "ST_HABITATION"
   is_sc_earmarked = Column(Boolean, default=False)
   is_st_earmarked = Column(Boolean, default=False)
   habitation_verification_status = Column(String(50), default="PENDING") # "VERIFIED_CENSUS", "UNVERIFIED"
   ```

2. **Update `MP` and `Constituency` Aggregates**:
   ```python
   # In MP and Constituency models
   sc_allocation_amount = Column(Float, default=0.0)
   st_allocation_amount = Column(Float, default=0.0)
   sc_allocation_pct = Column(Float, default=0.0) # Target: >= 15.0%
   st_allocation_pct = Column(Float, default=0.0) # Target: >= 7.5%
   earmarking_compliance_status = Column(String(50), default="COMPLIANT") # "COMPLIANT", "DEFICIT", "CRITICAL_NON_COMPLIANCE"
   ```

### Phase B: RAG Statutory Rule Definition
Add the following entry to `backend/app/ml/rag/knowledge_base.py`:
```python
"MPLADS_2023_SC_ST_MANDATE": {
    "title": "MPLADS Guidelines 2023 - Mandatory SC/ST Earmarking (Para 2.5)",
    "statutory_mandate": (
        "MPs must recommend works costing at least 15% of annual entitlement for SC habitations "
        "and 7.5% for ST habitations (total 22.5%). Funds cannot be diverted to general schemes."
    ),
    "compliance_thresholds": {
        "sc_minimum_pct": 15.0,
        "st_minimum_pct": 7.5,
        "combined_minimum_pct": 22.5,
    },
    "violation_indicator": (
        "Statutory social sub-plan deficit: Annual SC outlay below 15% or ST outlay below 7.5% "
        "without documented State Nodal Department geographical exemption."
    )
}
```

### Phase C: Statutory Anomaly Detector & Scoring
Introduce a deterministic statutory detector `SCEarmarkingDetector`:
$$\text{SC Deficit} = \max\left(0, 15.0 - \frac{\text{Outlay}_{\text{SC}}}{\text{Total Outlay}} \times 100\right)$$
$$\text{ST Deficit} = \max\left(0, 7.5 - \frac{\text{Outlay}_{\text{ST}}}{\text{Total Outlay}} \times 100\right)$$

* If total project lifecycle exceeds 180 days and $\text{SC Deficit} > 5.0\%$ or $\text{ST Deficit} > 2.5\%$, trigger an audit note:
  `[Statutory Earmarking] SUB_PLAN_QUOTA_DEFICIT (SC: {actual}% / 15%, ST: {actual}% / 7.5%)`
* Feed this directly into the MP Scorecard and Authority Audit Dossiers (`report_service.py`).

### Phase D: Frontend UI & Works Explorer Integration
1. **Works Explorer Filter**:
   * Add a filter toggle: `All Works | SC Habitation (15%) | ST Habitation (7.5%) | General`.
   * Add preset badge: **"Earmark Deficit Portfolio"**.
2. **MP Scorecard Page (`/mps/[id]`)**:
   * Display a dual-progress barometer:
     * **SC Quota**: Progress bar showing `Current %` vs `15% Target` (Green if $\ge 15\%$, Amber if $10-15\%$, Red if $< 10\%$).
     * **ST Quota**: Progress bar showing `Current %` vs `7.5% Target` (Green if $\ge 7.5\%$, Amber if $5-7.5\%$, Red if $< 5\%$).
3. **National PAC Audit Dossier (PDF)**:
   * Include a dedicated sub-table: *"Statutory Social Sector & Marginalized Habitation Compliance Summary"*.

---

## 5. Summary & Recommendation

| Dimension | Current Implementation | Planned Next State |
| :--- | :--- | :--- |
| **Data Schema** | Standard project attributes; no caste/tribal earmark tags. | Full `beneficiary_type`, `is_sc_earmarked`, and `is_st_earmarked` fields. |
| **Statistical Engine** | Evaluates procurement fraud, collusive cartels, & financial drift. | Adds deterministic statutory penalty for quota sub-plan deficits. |
| **Auditor Briefing** | Evaluates floods, election freezes, GFR 155 splitting. | RAG evaluates Para 2.5 compliance and checks for habitational verification certificates. |
| **Dashboard Presentation** | High/Critical risk, HHI concentration, financial outlay. | SC (15%) and ST (7.5%) real-time compliance gauges on MP and District scorecards. |

By incorporating this blueprint, SETU will not only detect multi-crore contractor cartels and ghost assets, but will also provide MoSPI and Parliamentary Committees with an **automated, unalterable accountability mechanism** protecting community investments in India's most vulnerable habitations.
