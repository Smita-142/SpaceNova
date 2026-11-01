"""
Media upload router for SpaceNova API.
Handles image, video, and 3D model file uploads.
"""
import aiofiles
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.services import file_service
from app.utils.file_utils import (
    get_project_dir, ensure_dir, safe_filename,
    validate_image, validate_video, validate_model,
    find_model_file, get_reconstruction_dir
)

router = APIRouter(prefix="/api/projects", tags=["media"])


@router.post("/{project_id}/upload")
async def upload_media(
    project_id: str,
    images: List[UploadFile] = File(default=[]),
    videos: List[UploadFile] = File(default=[]),
    model: UploadFile = File(default=None),
):
    """
    Upload images, videos, or a 3D model to a project.
    Files are validated and saved to the project directory.
    """
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project_dir = get_project_dir(project_id)
    ensure_dir(project_dir)

    saved_images = []
    saved_videos = []
    errors = []

    # Save images
    for img in images:
        if not img.filename:
            continue
        content = await img.read()
        err = validate_image(img.filename, len(content))
        if err:
            errors.append(f"{img.filename}: {err}")
            continue
        fname = safe_filename(img.filename)
        out_path = project_dir / fname
        # Avoid name collisions
        if out_path.exists():
            stem = Path(fname).stem
            ext = Path(fname).suffix
            out_path = project_dir / f"{stem}_{len(saved_images)}{ext}"
        async with aiofiles.open(out_path, "wb") as f:
            await f.write(content)
        saved_images.append(fname)

    # Save videos
    for vid in videos:
        if not vid.filename:
            continue
        content = await vid.read()
        err = validate_video(vid.filename, len(content))
        if err:
            errors.append(f"{vid.filename}: {err}")
            continue
        fname = safe_filename(vid.filename)
        out_path = project_dir / fname
        if out_path.exists():
            stem = Path(fname).stem
            ext = Path(fname).suffix
            out_path = project_dir / f"{stem}_{len(saved_videos)}{ext}"
        async with aiofiles.open(out_path, "wb") as f:
            await f.write(content)
        saved_videos.append(fname)

    if saved_images or saved_videos:
        from app.utils.file_utils import load_project_meta, save_project_meta
        meta = load_project_meta(project_id) or {}
        meta["reconstruction_status"] = "pending"
        meta["error_message"] = None
        save_project_meta(project_id, meta)

    # Save 3D model if provided
    if model and model.filename:
        content = await model.read()
        err = validate_model(model.filename, len(content))
        if err:
            errors.append(f"{model.filename}: {err}")
        else:
            # Save to reconstruction dir so find_model_file() finds it
            recon_dir = get_reconstruction_dir(project_id)
            ensure_dir(recon_dir)
            fname = safe_filename(model.filename)
            out_path = recon_dir / fname
            async with aiofiles.open(out_path, "wb") as f:
                await f.write(content)
            # Update project meta
            from app.utils.file_utils import load_project_meta, save_project_meta
            meta = load_project_meta(project_id) or {}
            meta["model_available"] = True
            meta["reconstruction_status"] = "completed"
            save_project_meta(project_id, meta)

    return {
        "project_id": project_id,
        "saved_images": len(saved_images),
        "saved_videos": len(saved_videos),
        "errors": errors,
    }
