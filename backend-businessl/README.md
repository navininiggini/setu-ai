# Backend Business & Technical Reports in LaTeX

This folder (`backend-businessl`) contains the authoritative technical reports for the system in publication-grade **LaTeX format** (`.tex`).

## Why LaTeX Format?
In standard markdown readers, complex mathematical equations, matrices, multi-tiered bounds, Greek symbols, and box-diagram ASCII representations are rendered as raw text or improperly spaced characters. 

In this folder, all reports are formatted in **fully self-contained, publication-quality LaTeX documents** with:
1. **Mathematical Equations & Notations**: Cleanly formatted display equations (`\[ ... \]`) and inline math (`$ ... $`) covering all risk-fusion objective functions, RobustScaler IQR transformations, Isolation Forest score normalizations, MAD-based Z-scores, payment velocity, progress gap slopes, and BOCPD run-length probability equations.
2. **Indian Rupee (₹) Symbol Support**: Robust cross-engine currency formatting (`\INR{}` / `Rs.`) compatible with both classical `pdflatex` and modern `xelatex` / `lualatex`.
3. **Multi-Domain Tables**: Formatted using `booktabs` and `tabularx` with full width auto-wrapping and bold structural headers.
4. **Architectural & Pipeline Diagrams**: Box-drawing flowcharts and relational models formatted inside framed `tcolorbox` containers with fixed-width listings.
5. **Syntax-Highlighted Source Code**: Exact Python implementations (`aggregators.py`, `preprocessor.py`, `feature_builder.py`, `risk_fusion_engine.py`) typeset with keywords, comments, and line numbers.

## Included LaTeX Reports

| File | Title & Scope | Primary Formulations & Artifacts |
|---|---|---|
| `report_1_business_logic.tex` | **Report 1: Business Logic & System Purpose** (Topics 1–5) | Entity hierarchy, $P_i \in \mathbb{R}^{239}$, Enrichment@$k$ optimization objective, Risk Fusion formula $R(P_i) = 0.40 \cdot (\hat{p} \times 100) + 0.35 \cdot \bar{s} + 0.25 \cdot \max(s_k)$, Acute override corroboration matrix, 7-domain architecture diagram. |
| `report_2_data_pipeline.tex` | **Report 2: Data Pipeline & Data Representation** (Topics 6–10) | 12-table relational schema, many-to-one transaction aggregation math, payment velocity & concentration formulas, MAD-normalized robust Z-score $Z_i^\text{robust}$, RobustScaler transformation, percentile normalization, complete data lineage traces. |
| `main_reports_1_and_2.tex` | **Master Combined Reports 1 & 2** | Complete unified monograph covering Reports 1 & 2 of the 12-report technical series. |
| `workstream_7_detection_hierarchy.tex` | **Workstream 7: Multi-Layer Detection Hierarchy** | Layers L0 through L4 anomaly architecture, 19 deterministic statutory checks, 4D KDTree terrain distance metric, Bayesian Online Change-Point Detection (BOCPD), Neo4j AuraDB cartel graph traversals. |

## How to Compile to PDF

### Option 1: Using `xelatex` or `lualatex` (Recommended for native Unicode)
```bash
xelatex report_1_business_logic.tex
xelatex report_2_data_pipeline.tex
xelatex main_reports_1_and_2.tex
```

### Option 2: Using standard `pdflatex`
All documents include fallback unicode mappings and ASCII literate substitutes:
```bash
pdflatex -interaction=nonstopmode report_1_business_logic.tex
pdflatex -interaction=nonstopmode report_2_data_pipeline.tex
pdflatex -interaction=nonstopmode main_reports_1_and_2.tex
```

### Option 3: Overleaf or TeXStudio / VS Code LaTeX Workshop
Simply upload any of the `.tex` files directly into Overleaf or your preferred LaTeX editor and click **Compile**.
