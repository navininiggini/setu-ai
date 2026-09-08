import pandas as pd
import numpy as np

def detect_stall_risk(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    
    if "DAYS_SINCE_RECOMMENDED" not in df.columns:
        df["DAYS_SINCE_RECOMMENDED"] = 0
        
    days = df["DAYS_SINCE_RECOMMENDED"].values
    statuses = df["STATUS"].fillna("").astype(str).str.lower().values
    approvals = df["IDA_APPROVAL"].fillna("").astype(str).str.lower().values
    
    # Extract planned duration if available (default to standard 180 days)
    if "PLANNED_DURATION_DAYS" in df.columns:
        planned_durations = pd.to_numeric(df["PLANNED_DURATION_DAYS"], errors="coerce").fillna(180).values
    else:
        planned_durations = np.full(len(df), 180)

    stall_scores = np.zeros(len(df))
    is_ghost_candidate = np.zeros(len(df), dtype=bool)
    
    for i in range(len(df)):
        d = days[i]
        st = statuses[i]
        app = approvals[i]
        planned = max(float(planned_durations[i]), 90.0)  # minimum 90 days
        overrun_ratio = d / planned  # 1.0 = on schedule, >1.0 = overrun
        
        # Stuck in Unsanctioned or Action Pending
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
            # Completed
            stall_scores[i] = 0.0
            
    df["STALL_RISK_SCORE"] = stall_scores
    df["IS_GHOST_CANDIDATE"] = is_ghost_candidate
    return df
