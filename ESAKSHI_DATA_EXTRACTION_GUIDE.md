# Masterclass Guide: How to Reverse-Engineer & Extract e-SAKSHI MPLADS Data

> **Target Scheme:** Members of Parliament Local Area Development Scheme (MPLADS)  
> **Target Portal:** [e-SAKSHI Citizen Dashboard (MoSPI)](https://www.mplads.mospi.gov.in)  
> **Extraction Protocol:** Pre-Authenticated REST Services (JSON / HTTP POST)

---

## 📖 Executive Summary

The official e-SAKSHI portal renders high-level charts and MP summaries on its web dashboard. However, underneath the user interface lies a set of **unauthenticated, pre-login REST endpoints** that serve granular, itemized records.

By communicating directly with these REST microservices instead of browser scraping (e.g. Selenium or Puppeteer), we achieve:
* **Over $100\times$ faster throughput** (sub-second API responses vs. rendering heavy DOMs).
* **Direct access to transaction-level financial vouchers, contractor IDs, and tender letters**.
* **Direct access to Base64-encoded PDF completion certificates, contractor bills, and JPEG inspection photos**.
* **Zero browser driver dependencies or authentication credential requirements**.

This guide teaches the complete extraction methodology step-by-step.

---

## 🛠️ Step 1: Discovering the Pre-Login Gateway

When inspecting network traffic (via Browser DevTools $\rightarrow$ Network $\rightarrow$ Fetch/XHR) on `https://www.mplads.mospi.gov.in/citizen-dashboard`, you observe that all dashboard widgets populate via endpoints prefixed with:

```http
POST /rest/PreLoginDashboardData/...
POST /rest/PreLoginCitizenWorkRcmdRest/...
```

### Why Pre-Login?
The government portal was designed to allow ordinary citizens to view public transparency metrics without registering for an account. Consequently, the backend does **not check for Authorization headers, cookies, or CSRF tokens** on these routes.

### Essential HTTP Headers
To prevent being rejected by Cloudflare or standard web application firewalls (WAF), pass realistic browser headers:

```python
HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.mplads.mospi.gov.in",
    "Referer": "https://www.mplads.mospi.gov.in/citizen-dashboard",
}
```

---

## 🗺️ Step 2: Extracting Master Geographic & Chamber Lookups

Before querying work-level data, you must map the administrative hierarchy:

### 1. States & Union Territories
* **Endpoint:** `POST https://www.mplads.mospi.gov.in/rest/PreLoginDashboardData/getStateData`
* **Payload:** `{}`
* **cURL Command:**
```bash
curl -k -s -X POST "https://www.mplads.mospi.gov.in/rest/PreLoginDashboardData/getStateData" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d "{}"
```
* **Sample Response:**
```json
[
  {"STATE_NAME": "Andaman And Nicobar Islands", "STATE_ID": 35},
  {"STATE_NAME": "Chandigarh", "STATE_ID": 7},
  {"STATE_NAME": "Delhi", "STATE_ID": 11},
  {"STATE_NAME": "Goa", "STATE_ID": 12}
]
```

### 2. Parliamentary House Codes
The portal uses an integer enumerator to differentiate between legislative bodies:
* `HOUSE_CODE = 2`: **Lok Sabha** (House of the People)
* `HOUSE_CODE = 1`: **Rajya Sabha** (Council of States)

### 3. Districts Lookup
* **Endpoint:** `POST https://www.mplads.mospi.gov.in/rest/PreLoginCitizenWorkRcmdRest/getDistrictByState`
* **Payload:** `{"stateId": 7}`

---

## 📦 Step 3: Understanding the `combo` Query Tuple

Granular tabular datasets are queried through a single multi-purpose endpoint:
* **Endpoint:** `POST https://www.mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData`

### The `combo` String Format:
The payload requires a comma-delimited filter string known as `combo`:
$$\text{combo} = \text{"<STATE\_ID>,<DISTRICT\_ID>,<BLOCK\_ID>,<HOUSE\_CODE>"}$$

* `7,0,0,2` $\implies$ State 7 (Chandigarh), All Districts (`0`), All Blocks (`0`), Lok Sabha (`2`).
* `11,0,0,2` $\implies$ State 11 (Delhi), All Districts (`0`), All Blocks (`0`), Lok Sabha (`2`).
* `0,0,0,2` $\implies$ All-India Lok Sabha (used for MP Allocations and Calamity Quota).

---

## 🔄 Step 4: Mastering the "Double-Serialization" Quirk

One of the most important architectural discoveries when working with e-SAKSHI is how table records are returned.

### The Response Anatomy:
When you send:
```bash
curl -k -s -X POST "https://www.mplads.mospi.gov.in/rest/PreLoginDashboardData/getTilesReportData" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{"combo": "7,0,0,2", "key": "Works Sanctioned"}'
```

The server returns:
```json
{
  "Total Sanction Work": "[{\"WORK_CATEGORY\":\"Trust and Society\",\"ACTIVITY_NAME\":\"WS/MP18047/2025-2026/233553...\",\"SANCTION_AMOUNT\":1000000.00}]"
}
```

Notice that the value of `"Total Sanction Work"` is **not an array of objects**, but a **JSON-escaped string**!

### The Two-Step Python Parser:
```python
import json
import requests

response = requests.post(url, json={"combo": "7,0,0,2", "key": "Works Sanctioned"}, headers=HEADERS)
outer_json = response.json()

# Step 1: Extract string payload
raw_string = outer_json.get("Total Sanction Work")

# Step 2: Deserialize the inner string into native Python dictionaries
if isinstance(raw_string, str):
    records = json.loads(raw_string)
else:
    records = raw_string

# Clean trailing aggregate summary rows if present
clean_records = [r for r in records if not (len(r) == 1 and "Total_Amt" in r)]
```

---

## 📑 Step 5: Querying the 4 Core Transactional Datasets

The table below lists the 4 core datasets required to track any MPLADS project from inception to completion:

| Dataset Name | API Payload `key` | Response Key | Critical Data Fields |
|---|---|---|---|
| **Recommendations** | `Works Recommended` | `Total Works Recommended` | `WORK_RECOMMENDATION_DTL_ID`, `MP_NAME`, `RECOMMENDED_AMOUNT`, `RECOMMENDATION_DATE`, `WORK_DESCRIPTION` |
| **Sanctions** | `Works Sanctioned` | `Total Sanction Work` | `WORK_RECOMMENDATION_DTL_ID`, `SANCTION_DATE`, `SANCTION_AMOUNT`, `IDA_NAME` (Implementing District Authority), `WORK_STAGE` |
| **Completed Assets** | `Works Completed` | `Total Works Completed` | `WORK_RECOMMENDATION_DTL_ID`, `WORK_ID`, `ACTUAL_AMOUNT`, `ACTUAL_END_DATE`, `ATTACH_ID` |
| **Vendor Expenditures** | `Expenditure on Completed and On-going Works as on Date` | `Total Expenditure` | `WORK_RECOMMENDATION_DTL_ID`, `VENDOR_NAME`, `VENDOR_ID`, `FUND_DISBURSED_AMT`, `EXPENDITURE_DATE`, `WORK_STATUS` |

---

## 📸 Step 6: Multi-Modal Evidence & Base64 Decoding

Unlike simple portals that only provide aggregate numbers, e-SAKSHI stores digital attachments (contractor bills, completion certificates, and geo-tagged photos).

Extracting them is a **two-step sequence**:

### Sub-step A: Fetch the Attachment Manifest
To find what files exist for a completed project, query `getAttachIdsbyFlag` with `FLAG: 3` (Flag 3 designates completion documents):

```bash
curl -k -s -X POST "https://www.mplads.mospi.gov.in/rest/PreLoginDashboardData/getAttachIdsbyFlag" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{"json": {"FLAG": 3, "WORK_ID": 108239}}'
```

*Response:*
```json
[
  {
    "FILE_NAME": ["bill 1 ward 26.pdf", "bill ward 26.pdf"],
    "ATTACH_ID": ["1597324.1653704", "1597324.1653705"]
  }
]
```

### Sub-step B: Download the File Bytes
Query `getAttachmentById` using the composite ID (`1597324.1653704`):

```bash
curl -k -s -X POST "https://www.mplads.mospi.gov.in/rest/PreLoginCitizenWorkRcmdRest/getAttachmentById" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{"id": "1597324.1653704"}'
```

*Response:*
```json
[
  {
    "FILE_NAME": "bill_1_ward_26.pdf",
    "URL": "JVBERi0xLjMNCiXDosOjw4/Dkw0KMSAwIG9iag0KPDwvUGFnZXMgMiAwIFIgL1R5cGUvQ2F0YWxvZz4+..."
  }
]
```

### Sub-step C: Decode Base64 to Disk in Python
The `"URL"` field contains raw Base64 bytes. `JVBERi0...` is the Base64 representation of `%PDF-1.x`.

```python
import base64
from pathlib import Path

b64_string = response_json[0]["URL"]
pdf_bytes = base64.b64decode(b64_string)

output_path = Path("real_database/attachments/bill_1_ward_26.pdf")
with open(output_path, "wb") as f:
    f.write(pdf_bytes)
```

---

## 💬 Step 7: Harvesting Public Citizen Feedback

Citizens submit feedback and star ratings on local MPLADS projects. This text is mined for sentiment analysis and field issue detection:

* **Endpoint:** `POST https://www.mplads.mospi.gov.in/rest/PreLoginCitizenWorkRcmdRest/getReviewDetailsByWork`
* **Payload:** `{"json": {"WORK_ID": 108239}}`
* **cURL Command:**
```bash
curl -k -s -X POST "https://www.mplads.mospi.gov.in/rest/PreLoginCitizenWorkRcmdRest/getReviewDetailsByWork" \
     -H "Content-Type: application/json; charset=utf-8" \
     -d '{"json": {"WORK_ID": 108239}}'
```
* **Sample Extracted Reviews:**
```json
[
  {"STAR_RATING": 5, "REVIEW_DETAIL": "good work"},
  {"STAR_RATING": 1, "REVIEW_DETAIL": "The road is of very bad quality it has been constructed for some months, and it started dissolving..."}
]
```

---

## 🔗 Step 8: Relational Linkage & Canonical Work Synthesis

To audit projects for fraud (such as contractor cartels, ghost works, or cost escalation), you link the discrete datasets using relational keys:

```
┌─────────────────────────────────┐
│       works_recommended         │
│ (WORK_RECOMMENDATION_DTL_ID)    │
└────────────────┬────────────────┘
                 │ 1:1
                 ▼
┌─────────────────────────────────┐
│        works_sanctioned         │
│ (WORK_RECOMMENDATION_DTL_ID)    │◄────── Master Anchor
└───────┬─────────────────┬───────┘
        │ 1:N             │ 1:1
        ▼                 ▼
┌──────────────────┐  ┌──────────────────┐
│vendor_expenditure│  │ works_completed  │
│ (disbursements)  │  │(WORK_ID, ATTACH) │
└──────────────────┘  └──────────────────┘
```

### Vital Financial Data Invariants:
1. **Filter Valid Disbursements:** Only include records where `WORK_STATUS == "Payment Success"`.
2. **Eliminate Penny-Drop Validation Probes:** The banking gateway initiates ₹1.00 or ₹2.00 test transactions before large disbursements. Any transaction $\le ₹10.00$ should be filtered out of real project expenditure totals.
3. **Handle Pending Vouchers:** Records marked `Payment In-Progress` are tracked separately as liquidity pipeline telemetry.

---

## ⚡ Step 9: Industrial-Grade Reliability & Ethics

When running large-scale scrapers across all 36 States/UTs:
1. **Polite Scraping:** Maintain a `0.2s` sleep interval between requests to avoid overloading government infrastructure.
2. **Circuit Breaker:** If 5 consecutive states return HTTP 500 or network timeouts, abort execution immediately to prevent data corruption.
3. **Path Traversal Sanitization:** Always sanitize filenames returned by remote APIs using `Path(filename).name` before writing to disk.

---

## 🚀 Step 10: Running the Extraction Script

The project provides a ready-to-run CLI script at [`scripts/extract_esakshi_data.py`](file:///home/jarvis/SIH-DEMOS/sih-2026-v1/sih-2026/scripts/extract_esakshi_data.py):

```bash
# Run extraction for sample states (Chandigarh, Goa, Delhi)
./backend/venv/bin/python3 scripts/extract_esakshi_data.py --states 7 12 11 --house lok_sabha --max-attachments 5 --out-dir real_database

# Run extraction for a specific state
./backend/venv/bin/python3 scripts/extract_esakshi_data.py --states 11 --house lok_sabha --out-dir real_database
```

The output is written into the `real_database/` directory, complete with relational CSV tables, downloaded PDFs, citizen reviews, and an index catalog.
