"""
File management service for SpaceNova.
Handles project CRUD and media file operations.
"""
import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from app.utils.file_utils import (
    get_project_dir, get_reconstruction_dir,
    ensure_dir, safe_filename,
    load_project_meta, save_project_meta,
    list_project_images, list_project_videos,
    count_extracted_frames, find_model_file,
    UPLOADS_DIR, RECONSTRUCTIONS_DIR,
)


def create_project(name: str, description: Optional[str] = None) -> dict:
    """Create a new project with a UUID and save metadata."""
    project_id = str(uuid.uuid4())
    project_dir = get_project_dir(project_id)
    ensure_dir(project_dir)

    meta = {
        "id": project_id,
        "name": name,
        "description": description or "",
        "created_at": datetime.utcnow().isoformat(),
        "reconstruction_status": "pending",
        "model_available": False,
        "error_message": None,
    }
    save_project_meta(project_id, meta)
    return enrich_project_meta(meta)


def get_project(project_id: str) -> Optional[dict]:
    """Load project metadata enriched with live file counts."""
    meta = load_project_meta(project_id)
    if meta is None:
        return None
    return enrich_project_meta(meta)


def list_projects() -> List[dict]:
    """List all projects sorted by creation date (newest first)."""
    if not UPLOADS_DIR.exists():
        return []
    projects = []
    for entry in UPLOADS_DIR.iterdir():
        if entry.is_dir():
            meta = load_project_meta(entry.name)
            if meta:
                projects.append(enrich_project_meta(meta))
    projects.sort(key=lambda p: p.get("created_at", ""), reverse=True)
    return projects


def delete_project(project_id: str) -> bool:
    """Delete project directory and reconstruction output."""
    project_dir = get_project_dir(project_id)
    recon_dir = get_reconstruction_dir(project_id)
    deleted = False
    if project_dir.exists():
        shutil.rmtree(project_dir)
        deleted = True
    if recon_dir.exists():
        shutil.rmtree(recon_dir)
    return deleted


def enrich_project_meta(meta: dict) -> dict:
    """Add live-computed fields (file counts, model availability) to metadata."""
    project_id = meta["id"]
    model_path = find_model_file(project_id)
    
    enriched = {
        **meta,
        "image_count": len(list_project_images(project_id)),
        "video_count": len(list_project_videos(project_id)),
        "extracted_frames": count_extracted_frames(project_id),
        "model_available": model_path is not None,
    }
    return enriched


def get_model_url(project_id: str, base_url: str) -> Optional[str]:
    """Return a URL to serve the model file, or None if not available."""
    model_path = find_model_file(project_id)
    if model_path is None:
        return None
    for storage_dir in (UPLOADS_DIR, RECONSTRUCTIONS_DIR):
        try:
            relative_path = model_path.relative_to(storage_dir)
        except ValueError:
            continue
        path = str(relative_path).replace("\\", "/")
        return f"{base_url}/files/{storage_dir.name}/{path}"
    raise ValueError(f"Model file is outside configured storage directories: {model_path}")
