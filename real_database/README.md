# e-SAKSHI Real MPLADS All-India National Database Catalog

This directory contains the **complete, live national database** harvested directly from the Ministry of Statistics and Programme Implementation (MoSPI) **e-SAKSHI portal** (`https://www.mplads.mospi.gov.in`).

> **Storage Format:** Stored as normalized, relational CSV datasets and verified binary inspection assets without SQLite integration.

---

## 📊 All-India National Corpus Overview

| Table / File | Description | Total Rows | File Size |
|---|---|---|---|
| [`tables/master_states.csv`](master_states.csv) | All 36 States and Union Territories of India | **36** | 543 B |
| [`tables/master_districts.csv`](master_districts.csv) | Complete administrative district directory | **796** | 24 KB |
| [`tables/works_recommended.csv`](works_recommended.csv) | All itemized project proposals submitted by MPs | **136,115** | 60 MB |
| [`tables/works_sanctioned.csv`](works_sanctioned.csv) | Approved projects with administrative and financial sanction | **102,771** | 45 MB |
| [`tables/works_completed.csv`](works_completed.csv) | Physically completed community assets with completion signoffs | **46,356** | 17 MB |
| [`tables/vendor_expenditures.csv`](vendor_expenditures.csv) | Granular contractor payment vouchers and bank transactions | **113,535** | 43 MB |
| [`tables/mp_allocations.csv`](mp_allocations.csv) | Statutory annual entitlement quotas and drawn balances | **775** | 116 KB |
| [`tables/mp_calamity.csv`](mp_calamity.csv) | Quota surrendered by MPs for disaster relief transfers | **32** | 5.5 KB |
| [`tables/canonical_works.csv`](canonical_works.csv) | Unified lifecycle master linked on `WORK_RECOMMENDATION_DTL_ID` | **102,771** | 47 MB |
| **Total Tabular Corpus** | | **538,537 rows** | **210 MB** |

---

## 📁 Directory Structure

```
real_database/
├── README.md                           # This catalog & data dictionary
├── tables/                             # Core relational CSV datasets (210 MB)
│   ├── master_states.csv               # 36 States & Union Territories
│   ├── master_districts.csv            # 796 Administrative Districts
│   ├── works_recommended.csv          # 136,115 MP Project Proposals
│   ├── works_sanctioned.csv           # 102,771 Approved Projects
│   ├── works_completed.csv            # 46,356 Completed Assets
│   ├── vendor_expenditures.csv        # 113,535 Contractor Payment Vouchers
│   ├── mp_allocations.csv             # 775 MP Quotas & Balances
│   ├── mp_calamity.csv                # 32 Calamity transfers
│   └── canonical_works.csv            # 102,771 Canonical Lifecycle Project Records
├── attachments/                        # Decoded multi-modal digital evidence (PDFs / Inspection photos)
│   ├── attachments_manifest.csv       # Manifest mapping WORK_ID, ATTACH_ID, original filenames, and disk paths
│   ├── work_155610_1494707.1545378_comp.pdf
│   ├── work_162906_1672435.1733134_completion.pdf
│   ├── work_175997_1597170.1653516_bill_ward_34.pdf
│   ├── work_175999_1597324.1653704_bill_1_ward_26.pdf
│   └── work_175999_1597324.1653705_bill_ward_26.pdf
└── reviews/                            # Public citizen feedback
    └── citizen_reviews.csv             # Star ratings (1-5) and textual complaints/reviews
```

---

## 🔗 Relational Linkage Key
* **`WORK_RECOMMENDATION_DTL_ID`**: The universal primary/foreign key uniting proposals, sanctions, expenditures, and completion.
* **`VENDOR_ID`**: Tracks repeat payouts, vendor monopolies, and procurement concentration.
* **`STATE_ID` & `DISTRICT_ID`**: Administrative mapping back to `master_states.csv` and `master_districts.csv`.
