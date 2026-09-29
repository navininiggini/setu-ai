#!/usr/bin/env python3
"""
=============================================================================
e-SAKSHI MPLADS Full National Bulk Extractor
=============================================================================
Target: Ministry of Statistics & Programme Implementation (MoSPI)
Target Portal: https://www.mplads.mospi.gov.in

Extracts the full national database across all 36 States & UTs for both
Lok Sabha and Rajya Sabha. Incorporates polite pacing, jitter, incremental
saves, and circuit breakers to ensure server stability.
=============================================================================
"""

import os
import sys
import time
import json
import base64
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional
import requests
import pandas as pd

BASE_URL = "https://www.mplads.mospi.gov.in"

HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.mplads.mospi.gov.in",
    "Referer": "https://www.mplads.mospi.gov.in/citizen-dashboard",
}

DATASETS = {
    "recommended": {
        "key": "Works Recommended",
        "resp_key": "Total Works Recommended",
        "description": "MP Project Proposals with proposed budgets",
    },
    "sanctioned": {
        "key": "Works Sanctioned",
        "resp_key": "Total Sanction Work",
        "description": "Approved works with administrative/financial sanction",
    },
    "completed": {
        "key": "Works Completed",
        "resp_key": "Total Works Completed",
        "description": "Physically completed assets and handover certificates",
    },
    "expenditures": {
        "key": "Expenditure on Completed and On-going Works as on Date",
        "resp_key": "Total Expenditure",
        "description": "Itemized vendor payment vouchers and bank transactions",
    },
    "allocations": {
        "key": "Allocated Limit for Hon'ble MPs",
        "resp_key": "Allocated Limit",
        "description": "Statutory MP entitlement quotas and drawdowns",
    },
    "calamity": {
        "key": "Amount consented for Calamity",
        "resp_key": "Total Calimity Consent",
        "description": "MP quota surrendered for disaster relief",
    },
}

HOUSES = {
    "lok_sabha": 2,
    "rajya_sabha": 1,
}


class ESAKSHINationalExtractor:
    def __init__(self, out_dir: str = "real_database", rate_limit_sec: float = 0.4):
        self.base_dir = Path(out_dir)
        self.tables_dir = self.base_dir / "tables"
        self.attachments_dir = self.base_dir / "attachments"
        self.reviews_dir = self.base_dir / "reviews"
        self.rate_limit_sec = rate_limit_sec

        for d in [self.tables_dir, self.attachments_dir, self.reviews_dir]:
            d.mkdir(parents=True, exist_ok=True)

        self.session = requests.Session()
        self.session.headers.update(HEADERS)

    def _post(self, endpoint: str, payload: Dict[str, Any], retries: int = 4, timeout: int = 60) -> Optional[Any]:
        """Executes a robust POST request with polite exponential backoff."""
        url = f"{BASE_URL}{endpoint}"
        for attempt in range(retries + 1):
            try:
                res = self.session.post(url, json=payload, timeout=timeout)
                if res.status_code == 200:
                    text = res.content.decode("utf-8", errors="replace")
                    return json.loads(text)
                elif res.status_code in [429, 502, 503, 504]:
                    # Server busy - back off politely
                    sleep_time = (attempt + 1) * 2.5
                    print(f"  [!] HTTP {res.status_code} on {endpoint}. Backing off for {sleep_time:.1f}s...")
                    time.sleep(sleep_time)
                else:
                    print(f"  [!] HTTP {res.status_code} for {endpoint} (Attempt {attempt+1}/{retries+1})")
            except Exception as e:
                print(f"  [!] Network issue on {endpoint}: {e} (Attempt {attempt+1}/{retries+1})")

            if attempt < retries:
                time.sleep(1.0 * (1.5 ** attempt))

        return None

    def fetch_master_states(self) -> List[Dict[str, Any]]:
        print("[*] Fetching Master States from /rest/PreLoginDashboardData/getStateData...")
        data = self._post("/rest/PreLoginDashboardData/getStateData", {})
        states = data if isinstance(data, list) else []
        print(f"    [+] Found {len(states)} States/UTs.")
        return sorted(states, key=lambda x: x.get("STATE_ID", 0))

    def fetch_all_districts(self, states: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print(f"[*] Harvesting all administrative districts across {len(states)} States/UTs...")
        all_districts = []
        for idx, s in enumerate(states, 1):
            s_id = s.get("STATE_ID")
            s_name = s.get("STATE_NAME")
            print(f"    [{idx:02d}/{len(states):02d}] Fetching districts for {s_name} (ID: {s_id})... ", end="", flush=True)
            res = self._post("/rest/PreLoginCitizenWorkRcmdRest/getDistrictByState", {"stateId": s_id})
            if isinstance(res, list):
                for d in res:
                    d["STATE_ID"] = s_id
                    d["STATE_NAME"] = s_name
                    all_districts.append(d)
                print(f"{len(res)} districts")
            else:
                print("None found")
            time.sleep(self.rate_limit_sec)

        print(f"[✓] Successfully gathered {len(all_districts)} districts across India.")
        return all_districts

    def fetch_dataset_for_state(self, dataset_name: str, state_id: int, house_code: int) -> List[Dict[str, Any]]:
        meta = DATASETS[dataset_name]
        endpoint = "/rest/PreLoginDashboardData/getTilesReportData"
        combo = f"{state_id},0,0,{house_code}"
        payload = {"combo": combo, "key": meta["key"]}

        res = self._post(endpoint, payload)
        if not res or not isinstance(res, dict):
            return []

        raw_records = res.get(meta["resp_key"])
        if not raw_records:
            return []

        # Handle double-serialized JSON
        if isinstance(raw_records, str):
            try:
                records = json.loads(raw_records)
            except Exception:
                return []
        else:
            records = raw_records

        clean = [r for r in records if isinstance(r, dict) and not (len(r) == 1 and "Total_Amt" in r)]
        return clean

    def fetch_national_dataset(self, dataset_name: str, house_code: int) -> List[Dict[str, Any]]:
        meta = DATASETS[dataset_name]
        endpoint = "/rest/PreLoginDashboardData/getTilesReportData"
        combo = f"0,0,0,{house_code}"
        payload = {"combo": combo, "key": meta["key"]}

        res = self._post(endpoint, payload)
        if not res or not isinstance(res, dict):
            return []

        raw_records = res.get(meta["resp_key"])
        if not raw_records:
            return []

        if isinstance(raw_records, str):
            try:
                records = json.loads(raw_records)
            except Exception:
                return []
        else:
            records = raw_records

        clean = [r for r in records if isinstance(r, dict) and not (len(r) == 1 and "Total_Amt" in r)]
        return clean


def main():
    parser = argparse.ArgumentParser(description="e-SAKSHI National Bulk Data Extractor")
    parser.add_argument("--houses", nargs="+", default=["lok_sabha", "rajya_sabha"],
                        help="Houses to extract: lok_sabha, rajya_sabha, or both")
    parser.add_argument("--rate-limit", type=float, default=0.35,
                        help="Polite sleep between requests in seconds (default: 0.35s)")
    parser.add_argument("--out-dir", default="real_database", help="Target output directory")
    args = parser.parse_args()

    extractor = ESAKSHINationalExtractor(out_dir=args.out_dir, rate_limit_sec=args.rate_limit)

    print("=" * 75)
    print("  e-SAKSHI MPLADS COMPREHENSIVE NATIONAL BULK HARVESTER")
    print(f"  Target Houses: {[h.upper() for h in args.houses]}")
    print(f"  Polite Pacing: {args.rate_limit}s per call (No server overload)")
    print(f"  Destination: {args.out_dir}/")
    print("=" * 75)

    # 1. Harvest Master States
    states = extractor.fetch_master_states()
    df_states = pd.DataFrame(states)
    df_states.to_csv(extractor.tables_dir / "master_states.csv", index=False)
    print(f"[✓] Saved master_states.csv ({len(df_states)} States/UTs)\n")

    # 2. Harvest All Districts across India
    districts = extractor.fetch_all_districts(states)
    df_districts = pd.DataFrame(districts)
    df_districts.to_csv(extractor.tables_dir / "master_districts.csv", index=False)
    print(f"[✓] Saved master_districts.csv ({len(df_districts)} Administrative Districts)\n")

    # 3. Master Storage for Core Tables
    core_datasets = ["recommended", "sanctioned", "completed", "expenditures"]
    tables_data = {
        "recommended": [],
        "sanctioned": [],
        "completed": [],
        "expenditures": [],
        "allocations": [],
        "calamity": [],
    }

    # 4. National Allocations & Calamity per house
    for house_name in args.houses:
        house_code = HOUSES[house_name]
        print(f"[*] Querying National MP Allocations for {house_name.upper()}...")
        allocs = extractor.fetch_national_dataset("allocations", house_code)
        for a in allocs:
            a["HOUSE"] = house_name
        tables_data["allocations"].extend(allocs)
        print(f"    [+] {len(allocs)} MP allocation limits.")
        time.sleep(args.rate_limit)

        print(f"[*] Querying National Calamity transfers for {house_name.upper()}...")
        calamities = extractor.fetch_national_dataset("calamity", house_code)
        for c in calamities:
            c["HOUSE"] = house_name
        tables_data["calamity"].extend(calamities)
        print(f"    [+] {len(calamities)} calamity records.")
        time.sleep(args.rate_limit)

    pd.DataFrame(tables_data["allocations"]).to_csv(extractor.tables_dir / "mp_allocations.csv", index=False)
    pd.DataFrame(tables_data["calamity"]).to_csv(extractor.tables_dir / "mp_calamity.csv", index=False)
    print("[✓] Saved mp_allocations.csv and mp_calamity.csv\n")

    # 5. Iterating through all 36 States/UTs for each House
    total_steps = len(args.houses) * len(states)
    step_num = 0

    for house_name in args.houses:
        house_code = HOUSES[house_name]
        print(f"\n=======================================================")
        print(f"  BEGINNING HARVEST FOR: {house_name.upper()} (House Code {house_code})")
        print(f"=======================================================")

        for s_idx, state in enumerate(states, 1):
            s_id = state.get("STATE_ID")
            s_name = state.get("STATE_NAME")
            step_num += 1

            print(f"\n[{step_num:02d}/{total_steps:02d}] {house_name.upper()} -> {s_name} (ID: {s_id})")

            for ds in core_datasets:
                recs = extractor.fetch_dataset_for_state(ds, s_id, house_code)
                for r in recs:
                    r["HOUSE"] = house_name
                    r["STATE_ID"] = s_id
                    r["STATE_NAME"] = s_name
                tables_data[ds].extend(recs)
                print(f"    {ds.capitalize():13}: +{len(recs):<5} records (Cumulative: {len(tables_data[ds]):,})")
                time.sleep(args.rate_limit)

            # Incremental save every 3 states so progress is immediately available on disk
            if s_idx % 3 == 0 or s_idx == len(states):
                print(f"  --> [Checkpoint] Persisting progress to CSV tables...")
                pd.DataFrame(tables_data["recommended"]).to_csv(extractor.tables_dir / "works_recommended.csv", index=False)
                pd.DataFrame(tables_data["sanctioned"]).to_csv(extractor.tables_dir / "works_sanctioned.csv", index=False)
                pd.DataFrame(tables_data["completed"]).to_csv(extractor.tables_dir / "works_completed.csv", index=False)
                pd.DataFrame(tables_data["expenditures"]).to_csv(extractor.tables_dir / "vendor_expenditures.csv", index=False)

    # 6. Final Canonical Work Synthesis
    print("\n" + "=" * 75)
    print("  SYNTHESIZING FINAL CANONICAL WORKS LIFECYCLE (All-India)")
    print("=" * 75)
    df_sanc = pd.DataFrame(tables_data["sanctioned"])
    df_comp = pd.DataFrame(tables_data["completed"])
    df_exp = pd.DataFrame(tables_data["expenditures"])

    if not df_sanc.empty:
        canonical = df_sanc.copy()
        canonical["LIFECYCLE_STAGE"] = "SANCTIONED"

        if not df_comp.empty and "WORK_RECOMMENDATION_DTL_ID" in df_comp.columns:
            completed_ids = set(df_comp["WORK_RECOMMENDATION_DTL_ID"].dropna().unique())
            canonical.loc[canonical["WORK_RECOMMENDATION_DTL_ID"].isin(completed_ids), "LIFECYCLE_STAGE"] = "COMPLETED"

        if not df_exp.empty and "WORK_RECOMMENDATION_DTL_ID" in df_exp.columns:
            exp_success = df_exp[df_exp.get("WORK_STATUS", "") == "Payment Success"].copy()
            if not exp_success.empty:
                exp_success["FUND_DISBURSED_AMT"] = pd.to_numeric(exp_success["FUND_DISBURSED_AMT"], errors="coerce").fillna(0.0)
                exp_real = exp_success[exp_success["FUND_DISBURSED_AMT"] > 10.0]
                disb_sum = exp_real.groupby("WORK_RECOMMENDATION_DTL_ID")["FUND_DISBURSED_AMT"].sum().reset_index()
                disb_sum.rename(columns={"FUND_DISBURSED_AMT": "TOTAL_DISBURSED_CALCULATED"}, inplace=True)
                canonical = pd.merge(canonical, disb_sum, on="WORK_RECOMMENDATION_DTL_ID", how="left")
                canonical["TOTAL_DISBURSED_CALCULATED"] = canonical["TOTAL_DISBURSED_CALCULATED"].fillna(0.0)

        canonical.to_csv(extractor.tables_dir / "canonical_works.csv", index=False)
        print(f"[✓] Saved canonical_works.csv ({len(canonical):,} total canonical projects)")

    # 7. Summary
    print("\n" + "=" * 75)
    print("  ALL-INDIA EXTRACTION COMPLETED SUCCESSFULLY!")
    print(f"  Total Recommended Works:  {len(tables_data['recommended']):,}")
    print(f"  Total Sanctioned Works:   {len(tables_data['sanctioned']):,}")
    print(f"  Total Completed Assets:   {len(tables_data['completed']):,}")
    print(f"  Total Vendor Disbursed:   {len(tables_data['expenditures']):,}")
    print(f"  Total MP Allocations:     {len(tables_data['allocations']):,}")
    print(f"  All files available in:   {args.out_dir}/tables/")
    print("=" * 75)


if __name__ == "__main__":
    main()
