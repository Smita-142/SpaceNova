"""
File utility functions for SpaceNova backend.
Handles safe path operations, directory management, and file validation.
"""
import os
import re
import uuid
import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime


# ── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent.parent  # backend/
DATA_DIR = Path(os.getenv("SPACE_NOVA_DATA_DIR", str(BASE_DIR))).expanduser()
UPLOADS_DIR = DATA_DIR / "uploads"
RECONSTRUCTIONS_DIR = DATA_DIR / "reconstructions"

ALLOWED_IMAGE_TYPES = {".jpg", ".jpeg", ".png"}
ALLOWED_VIDEO_TYPES = {".mp4", ".mov"}
ALLOWED_MODEL_TYPES = {".glb", ".gltf", ".ply"}

MAX_IMAGE_SIZE = 50 * 1024 * 1024   # 50 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 MB
MAX_MODEL_SIZE = 500 * 1024 * 1024  # 500 MB


def get_project_dir(project_id: str) -> Path:
    """Return the upload directory for a project."""
    safe_id = sanitize_id(project_id)
    return UPLOADS_DIR / safe_id


def get_reconstruction_dir(project_id: str) -> Path:
    """Return the reconstruction output directory for a project."""
    safe_id = sanitize_id(project_id)
    return RECONSTRUCTIONS_DIR / safe_id


def sanitize_id(project_id: str) -> str:
    """Prevent path traversal by validating UUID format."""
    if not re.match(r'^[a-f0-9\-]{36}$', project_id):
        raise ValueError(f"Invalid project ID format: {project_id}")
    return project_id


def ensure_dir(path: Path) -> Path:
    """Create directory tree if it doesn't exist."""
    path.mkdir(parents=True, exist_ok=True)
    return path


def safe_filename(filename: str) -> str:
    """Strip dangerous characters from a filename."""
    # Remove path separators and null bytes
    name = re.sub(r'[\\/:*?"<>|\x00]', '_', filename)
    # Collapse multiple underscores
    name = re.sub(r'_+', '_', name).strip('_')
    return name or "file"


def validate_image(filename: str, size: int) -> Optional[str]:
    """Return error string if image is invalid, else None."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_TYPES:
        return f"Invalid image type '{ext}'. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
    if size > MAX_IMAGE_SIZE:
        return f"Image too large ({size / 1024 / 1024:.1f} MB). Max 50 MB."
    return None


def validate_video(filename: str, size: int) -> Optional[str]:
    """Return error string if video is invalid, else None."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_TYPES:
        return f"Invalid video type '{ext}'. Allowed: {', '.join(ALLOWED_VIDEO_TYPES)}"
    if size > MAX_VIDEO_SIZE:
        return f"Video too large ({size / 1024 / 1024:.0f} MB). Max 500 MB."
    return None


def validate_model(filename: str, size: int) -> Optional[str]:
    """Return error string if model file is invalid, else None."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_MODEL_TYPES:
        return f"Invalid model type '{ext}'. Allowed: {', '.join(ALLOWED_MODEL_TYPES)}"
    if size > MAX_MODEL_SIZE:
        return f"Model too large. Max 500 MB."
    return None


def load_project_meta(project_id: str) -> Optional[dict]:
    """Load project metadata from JSON file."""
    meta_path = get_project_dir(project_id) / "meta.json"
    if not meta_path.exists():
        return None
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def save_project_meta(project_id: str, meta: dict) -> None:
    """Save project metadata to JSON file."""
    project_dir = get_project_dir(project_id)
    ensure_dir(project_dir)
    meta_path = project_dir / "meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, default=str)


def list_project_images(project_id: str) -> List[Path]:
    """Return sorted list of image files in a project directory."""
    project_dir = get_project_dir(project_id)
    if not project_dir.exists():
        return []
    return sorted([
        p for p in project_dir.iterdir()
        if p.suffix.lower() in ALLOWED_IMAGE_TYPES and p.is_file()
    ])


def list_project_videos(project_id: str) -> List[Path]:
    """Return sorted list of video files in a project directory."""
    project_dir = get_project_dir(project_id)
    if not project_dir.exists():
        return []
    return sorted([
        p for p in project_dir.iterdir()
        if p.suffix.lower() in ALLOWED_VIDEO_TYPES and p.is_file()
    ])


def count_extracted_frames(project_id: str) -> int:
    """Count extracted video frames in the frames/ subdirectory."""
    frames_dir = get_project_dir(project_id) / "frames"
    if not frames_dir.exists():
        return 0
    return len([p for p in frames_dir.iterdir() if p.suffix.lower() in {".jpg", ".png"}])


def find_model_file(project_id: str) -> Optional[Path]:
    """Find a browser-viewable model in the reconstruction or upload directory."""
    recon_dir = get_reconstruction_dir(project_id)
    if not recon_dir.exists():
        return None
    # Also check project uploads dir for imported models
    upload_dir = get_project_dir(project_id)
    for search_dir in [recon_dir, upload_dir]:
        for ext in [".glb", ".gltf", ".ply"]:
            found = list(search_dir.rglob(f"*{ext}"))
            if found:
                return found[0]
    return None
