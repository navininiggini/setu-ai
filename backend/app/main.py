import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.routers import (
    auth, dashboard, works, geo, graph, alerts, cases, reports, model_metrics, future_stubs, risk_intelligence
)
from app.ml.models.model_registry import get_model_registry
from app.ml.data.real_data_loader import load_real_mplads_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== [SETU System Startup] Initializing Database and ML Registry ===")
    Base.metadata.create_all(bind=engine)
    
    # Initialize / load ML models
    registry = get_model_registry()
    
    # Auto-seed database with real MPLADS data if needed
    try:
        db = SessionLocal()
        load_real_mplads_data(db, max_rows=12000, force_reload=False)
        db.close()
    except Exception as e:
        print(f"Startup Data Seeder Note: {e}")
        
    print("=== [SETU System Ready] FastAPI Backend Active ===")
    yield
    print("=== [SETU System Shutdown] ===")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SETU is a high-density, explainable AI anti-fraud platform for India's MPLADS fund utilization (SIH 2026).",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(works.router, prefix=settings.API_V1_STR)
app.include_router(geo.router, prefix=settings.API_V1_STR)
app.include_router(graph.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(cases.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(model_metrics.router, prefix=settings.API_V1_STR)
app.include_router(future_stubs.router, prefix=settings.API_V1_STR)
app.include_router(risk_intelligence.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "platform": "SETU",
        "description": "AI-Powered MPLADS Anomaly, Fraud & Inefficiency Detection Platform",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "setu-backend"}
