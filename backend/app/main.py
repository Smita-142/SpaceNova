"""
SpaceNova Backend API — Main Application Entry Point
====================================================
Team TechNova | Namma Space Competition | Techfest IIT Bombay

Start:
    uvicorn app.main:app --reload --port 8000

Docs: http://localhost:8000/docs
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import projects, media, reconstruction
from app.services.reconstruction_service import COLMAP_AVAILABLE, OPENCV_AVAILABLE
from app.utils.file_utils import UPLOADS_DIR, RECONSTRUCTIONS_DIR, ensure_dir

# ── Ensure storage directories exist on startup ───────────────────────────────
ensure_dir(UPLOADS_DIR)
ensure_dir(RECONSTRUCTIONS_DIR)

# ── FastAPI application ───────────────────────────────────────────────────────
app = FastAPI(
    title="SpaceNova API",
    description=(
        "Backend API for **SpaceNova** — Intelligent Indoor 3D Digital Twin Platform.\n\n"
        "Built by **Team TechNova** for the Namma Space competition at Techfest IIT Bombay."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file server for uploads / reconstructions ─────────────────────────
# Uploaded media and generated models may live on a persistent mounted volume.
app.mount("/files/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount(
    "/files/reconstructions",
    StaticFiles(directory=str(RECONSTRUCTIONS_DIR)),
    name="reconstructions",
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(projects.router)
app.include_router(media.router)
app.include_router(reconstruction.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["system"])
async def health_check():
    """
    Returns backend status and system capability information.
    Frontend polls this every 30 s to show connection status.
    """
    return {
        "status": "ok",
        "message": "SpaceNova API is running",
        "version": "1.0.0",
        "colmap_available": COLMAP_AVAILABLE,
        "opencv_available": OPENCV_AVAILABLE,
    }


@app.get("/", tags=["system"])
async def root():
    return {"message": "SpaceNova API", "docs": "/docs", "health": "/api/health"}
