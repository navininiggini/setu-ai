import os
from pathlib import Path
from typing import List, Union, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_ROOT = BASE_DIR.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SETU — AI-Powered MPLADS Anomaly, Fraud & Inefficiency Detection"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "setu-mplads-super-secret-key-sih-2026-hackathon-secure-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (PostgreSQL if available, SQLite default/fallback)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/setu_mplads.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Data & Paths
    CSV_DATA_PATH: str = str(WORKSPACE_ROOT / "MPLADS_cleaned_featured.csv")
    SYNTHETIC_DATA_PATH: str = str(BASE_DIR / "data" / "processed" / "synthetic_mplads.csv")
    SAVED_MODELS_DIR: str = str(BASE_DIR / "app" / "ml" / "saved_models")
    GEO_DATA_DIR: str = str(BASE_DIR / "data" / "geo")
    PROCESSED_DATA_DIR: str = str(BASE_DIR / "data" / "processed")

    # Gemini Decision Support
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-3.6-flash")
    DECISION_SUPPORT_ENABLED: bool = os.getenv("DECISION_SUPPORT_ENABLED", "true").lower() in ("true", "1", "t")
    DECISION_SUPPORT_TIMEOUT_SECONDS: float = float(os.getenv("DECISION_SUPPORT_TIMEOUT_SECONDS", "5.0"))
    DECISION_SUPPORT_MAX_CONCURRENCY: int = int(os.getenv("DECISION_SUPPORT_MAX_CONCURRENCY", "5"))
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
