"""
Reconstruction router — frame extraction, COLMAP pipeline, status polling.
"""
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import (
    ExtractFramesRequest, ExtractFramesResponse,
    ReconstructRequest, ProjectStatusResponse, ModelResponse,
)
from app.services import file_service, reconstruction_service
from app.utils.file_utils import (
    get_reconstruction_dir,
    load_project_meta, save_project_meta,
    find_model_file, list_project_videos,
)

router = APIRouter(prefix="/api/projects", tags=["reconstruction"])


def _read_log_tail(path: Path, max_bytes: int = 8192, max_lines: int = 20) -> str:
    """Read only the end of a COLMAP log so status polling stays inexpensive."""
    with path.open("rb") as log_file:
        log_file.seek(0, 2)
        log_file.seek(max(0, log_file.tell() - max_bytes))
        content = log_file.read().decode("utf-8", errors="replace")
    return "\n".join(content.splitlines()[-max_lines:])


@router.post("/{project_id}/extract-frames", response_model=ExtractFramesResponse)
async def extract_frames(project_id: str, body: ExtractFramesRequest):
    """Extract frames from all videos in the project at the given fps."""
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if not reconstruction_service.OPENCV_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenCV is not installed on the backend. "
                "Install it with: pip install opencv-python-headless"
            ),
        )

    if not list_project_videos(project_id):
        raise HTTPException(status_code=400, detail="No videos found in this project")

    count, error = reconstruction_service.extract_all_project_frames(project_id, fps=body.fps)
    if error:
        raise HTTPException(status_code=500, detail=error)

    return ExtractFramesResponse(
        project_id=project_id,
        frame_count=count,
        message=f"Extracted {count} frames successfully",
    )


@router.post("/{project_id}/reconstruct")
async def start_reconstruction(project_id: str, body: ReconstructRequest):
    """
    Start the COLMAP reconstruction pipeline asynchronously.
    Returns immediately; poll /status for updates.
    """
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    if not reconstruction_service.COLMAP_AVAILABLE:
        # Persist no_colmap status so frontend can detect it on next load
        meta = load_project_meta(project_id) or {}
        meta["reconstruction_status"] = "no_colmap"
        meta["error_message"] = (
            "COLMAP is not installed on this system. "
            "Please install COLMAP (https://colmap.github.io/install.html) "
            "to run 3D reconstruction. You can import an existing GLB/GLTF/PLY model instead."
        )
        save_project_meta(project_id, meta)
        raise HTTPException(
            status_code=503,
            detail=(
                "COLMAP is not available. Install COLMAP to run reconstruction. "
                "Alternatively, import an existing GLB/GLTF/PLY model via the upload endpoint."
            ),
        )

    total_images = project["image_count"] + project["extracted_frames"]
    if total_images < 3:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Need at least 3 images for reconstruction (found {total_images}). "
                "Upload more images or extract frames from a video first."
            ),
        )

    if not reconstruction_service.start_reconstruction_async(project_id):
        raise HTTPException(
            status_code=409,
            detail="Reconstruction is already running for this project.",
        )

    return {
        "project_id": project_id,
        "status": "processing",
        "message": "Reconstruction started. Poll /status for updates.",
    }


@router.get("/{project_id}/status", response_model=ProjectStatusResponse)
async def get_status(project_id: str):
    """Get current reconstruction status for a project."""
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    meta = load_project_meta(project_id) or {}
    meta = reconstruction_service.reconcile_reconstruction_status(project_id, meta)

    # Read a bounded tail while COLMAP writes progress to the log.
    log_tail = None
    log_path = get_reconstruction_dir(project_id) / "colmap.log"
    if log_path.exists():
        try:
            log_tail = _read_log_tail(log_path)
        except OSError:
            pass

    return ProjectStatusResponse(
        id=project_id,
        reconstruction_status=meta.get("reconstruction_status", "pending"),
        colmap_available=reconstruction_service.COLMAP_AVAILABLE,
        log_tail=log_tail,
        error_message=meta.get("error_message"),
        model_available=project["model_available"],
    )


@router.get("/{project_id}/model", response_model=ModelResponse)
async def get_model(project_id: str, request: Request):
    """Return model file URL if available."""
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    model_path = find_model_file(project_id)
    if model_path is None:
        return ModelResponse(
            project_id=project_id, model_available=False, model_url=None, model_filename=None
        )

    base_url = str(request.base_url).rstrip("/")
    url = file_service.get_model_url(project_id, base_url)

    return ModelResponse(
        project_id=project_id,
        model_available=True,
        model_url=url,
        model_filename=model_path.name,
    )
