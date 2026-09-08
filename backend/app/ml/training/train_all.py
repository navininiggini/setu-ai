import os
import sys
from pathlib import Path

# Ensure backend root in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from app.core.config import settings
from app.ml.data.synthetic_generator import SyntheticMPLADSGenerator
from app.ml.features.feature_pipeline import build_feature_pipeline, FEATURE_COLUMNS
from app.ml.models.model_registry import get_model_registry
from app.ml.training.evaluate_models import evaluate_classifier_model

def train_all_models(n_rows: int = 20000):
    print(f"--- [SETU ML Training] Step 1: Generating {n_rows} Synthetic Labeled Records ---")
    gen = SyntheticMPLADSGenerator(n_rows=n_rows, seed=42)
    synthetic_df = gen.generate()
    
    # Ensure processed directory exists
    processed_dir = Path(settings.PROCESSED_DATA_DIR)
    processed_dir.mkdir(parents=True, exist_ok=True)
    synthetic_csv_path = processed_dir / "synthetic_mplads.csv"
    synthetic_df.to_csv(synthetic_csv_path, index=False)
    print(f"Saved synthetic dataset to: {synthetic_csv_path}")

    print("--- [SETU ML Training] Step 2: Running Leakage-Free Data Partitioning & Feature Pipeline ---")
    from sklearn.model_selection import GroupShuffleSplit

    # Group by MP_NAME to prevent entity and clone leakage between train and test
    groups = synthetic_df["MP_NAME"].values
    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(gss.split(synthetic_df, groups=groups))

    train_raw = synthetic_df.iloc[train_idx].copy().reset_index(drop=True)
    test_raw = synthetic_df.iloc[test_idx].copy().reset_index(drop=True)

    print(f"Train raw records: {len(train_raw)} | Test raw records: {len(test_raw)}")

    # Build features INDEPENDENTLY on train and test
    train_featured = build_feature_pipeline(train_raw, is_training=True)
    test_featured = build_feature_pipeline(test_raw, is_training=False)

    X_train = train_featured[FEATURE_COLUMNS].values
    y_train = train_featured["is_fraud"].values
    X_test = test_featured[FEATURE_COLUMNS].values
    y_test = test_featured["is_fraud"].values

    print(f"Train sample: {len(X_train)} | Test sample: {len(X_test)} | Fraud rate: {np.mean(y_train):.3%}")

    registry = get_model_registry()

    print("--- [SETU ML Training] Step 3: Fitting Isolation Forest Detector ---")
    registry.iso_forest.fit(X_train)

    print("--- [SETU ML Training] Step 4: Fitting Local Outlier Factor Detector ---")
    registry.lof.fit(X_train)

    print("--- [SETU ML Training] Step 5: Training XGBoost Fraud Classifier ---")
    registry.xgb.fit(X_train, y_train, feature_names=FEATURE_COLUMNS)

    print("--- [SETU ML Training] Step 6: Building MP-IDA Network Graph Model ---")
    registry.graph_model.fit_from_dataframe(train_raw)

    print("--- [SETU ML Training] Step 7: Evaluating on Test Set & Saving Metrics ---")
    y_test_proba = registry.xgb.predict_proba(X_test)
    importances = registry.xgb.get_feature_importances()
    metrics = evaluate_classifier_model(y_test, y_test_proba, feature_importances=importances)

    print(f"Metrics -> Accuracy: {metrics['accuracy']:.3f} | Precision: {metrics['precision']:.3f} | Recall: {metrics['recall']:.3f} | ROC-AUC: {metrics['roc_auc']:.3f}")

    print("--- [SETU ML Training] Step 8: Persisting Trained Model Artifacts ---")
    registry.save_models()
    print("All models successfully saved in saved_models directory.")
    return metrics

if __name__ == "__main__":
    train_all_models(20000)
