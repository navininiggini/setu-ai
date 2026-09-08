import pandas as pd
import numpy as np

COMMON_THRESHOLDS = [500_000, 1_000_000, 2_500_000, 5_000_000]

def detect_structuring(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    amounts = df["ALLOCATION_AMOUNT"].values
    structuring_scores = np.zeros(len(df))
    is_structured = np.zeros(len(df), dtype=bool)
    
    # 1. Single-row ratio check (amount just under statutory thresholds)
    for i, amt in enumerate(amounts):
        if amt <= 0:
            continue
        for thresh in COMMON_THRESHOLDS:
            ratio = amt / thresh
            if 0.94 <= ratio <= 0.999:
                score = (ratio - 0.94) / (1.0 - 0.94)
                if score > structuring_scores[i]:
                    structuring_scores[i] = score
                    is_structured[i] = True

    # 2. Multi-row contract splitting / smurfing detection pass
    contractor_col = None
    for col in ["CONTRACTOR", "IDA", "VENDOR", "AGENCY"]:
        if col in df.columns and df[col].notna().sum() > 0:
            contractor_col = col
            break
            
    if contractor_col is not None and len(df) > 1:
        group_cols = [contractor_col]
        for geo_col in ["CONSTITUENCY", "DISTRICT", "BLOCK"]:
            if geo_col in df.columns and df[geo_col].notna().sum() > 0:
                group_cols.append(geo_col)
                break

        for thresh in COMMON_THRESHOLDS:
            agg = df.groupby(group_cols).agg(
                total_amount=("ALLOCATION_AMOUNT", "sum"),
                n_contracts=("ALLOCATION_AMOUNT", "count"),
                max_single=("ALLOCATION_AMOUNT", "max")
            ).reset_index()

            split_candidates = agg[
                (agg["n_contracts"] >= 2)
                & (agg["max_single"] < thresh)
                & (agg["total_amount"] >= thresh * 0.85)
            ]

            if len(split_candidates) > 0:
                flagged_keys = set(
                    tuple(row[c] for c in group_cols)
                    for _, row in split_candidates.iterrows()
                )
                for idx, row in df.iterrows():
                    key = tuple(row[c] for c in group_cols)
                    if key in flagged_keys:
                        multi_score = min(1.0, 0.60 + 0.35 * min(1.0, (row["ALLOCATION_AMOUNT"] * 2) / thresh))
                        if multi_score > structuring_scores[idx]:
                            structuring_scores[idx] = multi_score
                            is_structured[idx] = True

    df["STRUCTURING_SCORE"] = structuring_scores
    df["IS_STRUCTURED_CANDIDATE"] = is_structured
    return df
