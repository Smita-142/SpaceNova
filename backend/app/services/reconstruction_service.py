"""
Reconstruction service for SpaceNova.

Handles:
1. Video frame extraction using OpenCV
2. COLMAP reconstruction pipeline (when available)
3. Status tracking and error reporting

COLMAP must be installed separately.
"""
import os
import subprocess
import shutil
import time
import threading
import json
import math
import re
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime

from app.utils.file_utils import (
    get_project_dir, get_reconstruction_dir,
    ensure_dir, list_project_images, list_project_videos,
    count_extracted_frames, save_project_meta, load_project_meta,
    safe_filename,
)


# ── OpenCV availability check ──────────────────────────────────────────────────
try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


# ── COLMAP availability check ──────────────────────────────────────────────────
def get_colmap_command() -> str:
    """Resolve COLMAP from configuration, PATH, or the common Windows release folder."""
    configured_command = os.getenv("COLMAP_EXECUTABLE", "").strip().strip('"')
    if configured_command:
        configured_path = Path(configured_command).expanduser()
        if configured_path.is_file():
            return str(configured_path.resolve())
        return shutil.which(configured_command) or configured_command

    path_command = shutil.which("colmap")
    if path_command:
        return path_command

    windows_release = (
        Path.home() / "Downloads" / "colmap-x64-windows-nocuda" / "bin" / "colmap.exe"
    )
    if windows_release.is_file():
        return str(windows_release.resolve())

    return "colmap"


COLMAP_COMMAND = get_colmap_command()


def get_colmap_environment() -> dict[str, str]:
    """Include the bundled Windows COLMAP runtime and Qt plugin paths."""
    env = os.environ.copy()
    executable_dir = Path(COLMAP_COMMAND).expanduser().parent
    if not executable_dir.is_dir():
        return env

    env["PATH"] = os.pathsep.join(
        path for path in (str(executable_dir), env.get("PATH", "")) if path
    )
    plugin_dir = executable_dir.parent / "plugins"
    if plugin_dir.is_dir():
        env["QT_PLUGIN_PATH"] = os.pathsep.join(
            path for path in (str(plugin_dir), env.get("QT_PLUGIN_PATH", "")) if path
        )
    return env


def check_colmap_available() -> bool:
    """Check whether the configured COLMAP executable can run."""
    try:
        result = subprocess.run(
            [COLMAP_COMMAND, "--help"], env=get_colmap_environment(),
            capture_output=True, timeout=10
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


COLMAP_AVAILABLE = check_colmap_available()

_ACTIVE_RECONSTRUCTIONS: set[str] = set()
_RECONSTRUCTION_LOCK = threading.Lock()
MAX_RECONSTRUCTION_IMAGE_SIZE = 2000


def is_reconstruction_running(project_id: str) -> bool:
    """Return whether this process currently owns a reconstruction worker."""
    with _RECONSTRUCTION_LOCK:
        return project_id in _ACTIVE_RECONSTRUCTIONS


def reconcile_reconstruction_status(project_id: str, meta: dict) -> dict:
    """Mark a persisted job as interrupted when its in-process worker is gone."""
    if (
        meta.get("reconstruction_status") == "processing"
        and not is_reconstruction_running(project_id)
    ):
        meta["reconstruction_status"] = "failed"
        meta["error_message"] = (
            "Reconstruction was interrupted when the backend stopped. "
            "Start reconstruction again to retry."
        )
        meta["reconstruction_failed_at"] = datetime.utcnow().isoformat()
        save_project_meta(project_id, meta)
    return meta


def resize_reconstruction_images(images_dir: Path) -> int:
    """Downscale staging copies before COLMAP to reduce CPU cost on large captures."""
    if not OPENCV_AVAILABLE:
        return 0

    resized_count = 0
    for image_path in sorted(images_dir.iterdir()):
        if not image_path.is_file() or image_path.suffix.lower() not in {
            ".jpg", ".jpeg", ".png"
        }:
            continue

        image = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
        if image is None:
            raise RuntimeError(f"Could not read reconstruction image: {image_path.name}")

        height, width = image.shape[:2]
        largest_dimension = max(height, width)
        if largest_dimension <= MAX_RECONSTRUCTION_IMAGE_SIZE:
            continue

        scale = MAX_RECONSTRUCTION_IMAGE_SIZE / largest_dimension
        resized = cv2.resize(
            image,
            (round(width * scale), round(height * scale)),
            interpolation=cv2.INTER_AREA,
        )
        if not cv2.imwrite(str(image_path), resized):
            raise RuntimeError(f"Could not prepare reconstruction image: {image_path.name}")
        resized_count += 1

    return resized_count


# ── Frame Extraction ───────────────────────────────────────────────────────────
def extract_frames_from_video(
    project_id: str,
    video_path: Path,
    fps: float = 1.0
) -> Tuple[int, Optional[str]]:
    """
    Extract frames from a video file at the given fps rate.
    
    Returns: (frame_count, error_message)
    """
    if not OPENCV_AVAILABLE:
        return 0, "OpenCV is not installed. Cannot extract frames."

    if not math.isfinite(fps) or not 0.1 <= fps <= 30.0:
        return 0, "FPS must be between 0.1 and 30."

    frames_dir = get_project_dir(project_id) / "frames"
    ensure_dir(frames_dir)

    cap = None
    try:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return 0, f"Could not open video file: {video_path.name}"

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        if video_fps <= 0:
            return 0, "Invalid video: could not determine FPS"

        # How many source frames to skip between each extracted frame
        frame_interval = max(1, int(video_fps / fps))

        frame_prefix = safe_filename(video_path.name)
        frame_idx = 0
        saved_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_interval == 0:
                out_path = frames_dir / f"{frame_prefix}_frame_{saved_count:06d}.jpg"
                if not cv2.imwrite(str(out_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 90]):
                    return saved_count, f"Could not write extracted frame: {out_path.name}"
                saved_count += 1

            frame_idx += 1

        current_frames = {
            path.name for path in frames_dir.iterdir()
            if re.fullmatch(
                re.escape(frame_prefix) + r"_frame_\d{6}\.jpg", path.name
            )
        }
        expected_frames = {
            f"{frame_prefix}_frame_{idx:06d}.jpg" for idx in range(saved_count)
        }
        for stale_frame in current_frames - expected_frames:
            (frames_dir / stale_frame).unlink()

        return saved_count, None

    except Exception as e:
        return 0, f"Frame extraction error: {str(e)}"
    finally:
        if cap is not None:
            cap.release()


def extract_all_project_frames(
    project_id: str,
    fps: float = 1.0
) -> Tuple[int, Optional[str]]:
    """Extract frames from all videos in a project."""
    videos = list_project_videos(project_id)
    if not videos:
        return 0, "No video files found in project"

    total = 0
    for video in videos:
        count, err = extract_frames_from_video(project_id, video, fps)
        if err:
            return total, f"Error processing {video.name}: {err}"
        total += count

    return total, None


# ── COLMAP Reconstruction ──────────────────────────────────────────────────────
def run_colmap_reconstruction(project_id: str) -> None:
    """
    Execute the COLMAP reconstruction pipeline in a background thread.
    Updates project metadata with status and errors.
    
    Pipeline steps:
    1. Collect all images (uploaded + extracted frames)
    2. Run CPU-based feature extraction and matching
    3. Run colmap mapper (sparse reconstruction)
    4. Export the sparse model as a PLY point cloud for the browser viewer
    
    Dense reconstruction and textured meshing are not included in this prototype.
    """
    meta = load_project_meta(project_id) or {}
    meta["reconstruction_status"] = "processing"
    meta["reconstruction_started_at"] = datetime.utcnow().isoformat()
    meta["error_message"] = None
    save_project_meta(project_id, meta)

    try:
        project_dir = get_project_dir(project_id)
        recon_dir = get_reconstruction_dir(project_id)
        ensure_dir(recon_dir)

        # Collect all images: uploaded images + extracted frames
        images_dir = recon_dir / "images"
        ensure_dir(images_dir)
        for existing_image in images_dir.iterdir():
            if existing_image.is_file() and existing_image.suffix.lower() in {
                ".jpg", ".jpeg", ".png"
            }:
                existing_image.unlink()

        # Copy uploaded images
        for img in list_project_images(project_id):
            shutil.copy2(img, images_dir / img.name)

        # Copy extracted frames
        frames_dir = project_dir / "frames"
        if frames_dir.exists():
            for frm in sorted(frames_dir.iterdir()):
                if frm.suffix.lower() in {".jpg", ".jpeg", ".png"}:
                    shutil.copy2(frm, images_dir / frm.name)

        total_images = sum(
            1 for image in images_dir.iterdir()
            if image.is_file() and image.suffix.lower() in {".jpg", ".jpeg", ".png"}
        )
        if total_images < 3:
            raise RuntimeError(f"Need at least 3 images for reconstruction, found {total_images}")

        db_path = recon_dir / "database.db"
        sparse_dir = recon_dir / "sparse"
        if db_path.is_file():
            db_path.unlink()
        if sparse_dir.exists():
            shutil.rmtree(sparse_dir)
        ensure_dir(sparse_dir)
        log_path = recon_dir / "colmap.log"
        resized_count = resize_reconstruction_images(images_dir)
        with open(log_path, "w", encoding="utf-8") as log:
            log.write(
                f"Prepared {total_images} images; downscaled {resized_count} "
                f"to at most {MAX_RECONSTRUCTION_IMAGE_SIZE}px for CPU reconstruction.\n"
            )

        def run_cmd(args: list, step: str):
            """Run a COLMAP command and log output."""
            with open(log_path, "a", encoding="utf-8", errors="replace") as log:
                log.write(f"\n=== {step} ===\n")
                log.flush()
                result = subprocess.run(
                    [COLMAP_COMMAND, *args], env=get_colmap_environment(),
                    stdout=log, stderr=subprocess.STDOUT, text=True, timeout=3600
                )
                log.write("\n")
                if result.returncode != 0:
                    raise RuntimeError(
                        f"COLMAP {step} failed (exit {result.returncode}); "
                        "see the reconstruction log for details."
                    )

        # Step 1: Feature extraction
        run_cmd([
            "feature_extractor",
            "--database_path", str(db_path),
            "--image_path", str(images_dir),
            "--ImageReader.camera_model", "SIMPLE_RADIAL",
            "--ImageReader.single_camera", "1",
            "--FeatureExtraction.use_gpu", "0",
        ], "feature_extractor")

        # Step 2: Feature matching
        run_cmd([
            "exhaustive_matcher",
            "--database_path", str(db_path),
            "--FeatureMatching.use_gpu", "0",
        ], "exhaustive_matcher")

        # Step 3: Sparse reconstruction (Structure from Motion)
        run_cmd([
            "mapper",
            "--database_path", str(db_path),
            "--image_path", str(images_dir),
            "--output_path", str(sparse_dir),
        ], "mapper")

        sparse_models = sorted(
            path for path in sparse_dir.iterdir()
            if path.is_dir() and any(path.iterdir())
        )
        if not sparse_models:
            raise RuntimeError("COLMAP mapper did not produce a sparse model")

        model_path = recon_dir / "sparse_reconstruction.ply"
        run_cmd([
            "model_converter",
            "--input_path", str(sparse_models[0]),
            "--output_path", str(model_path),
            "--output_type", "PLY",
        ], "model_converter")
        if not model_path.is_file() or model_path.stat().st_size == 0:
            raise RuntimeError("COLMAP did not produce a usable PLY point cloud")

        # Mark success
        meta["reconstruction_status"] = "completed"
        meta["reconstruction_completed_at"] = datetime.utcnow().isoformat()
        meta["model_available"] = True
        meta["colmap_note"] = "Sparse point cloud exported as PLY; dense meshing is not included."
        save_project_meta(project_id, meta)

    except Exception as e:
        meta["reconstruction_status"] = "failed"
        meta["error_message"] = str(e)
        meta["reconstruction_failed_at"] = datetime.utcnow().isoformat()
        save_project_meta(project_id, meta)


def _run_reconstruction_worker(project_id: str) -> None:
    try:
        run_colmap_reconstruction(project_id)
    finally:
        with _RECONSTRUCTION_LOCK:
            _ACTIVE_RECONSTRUCTIONS.discard(project_id)


def start_reconstruction_async(project_id: str) -> bool:
    """Launch one reconstruction worker per project in a background thread."""
    with _RECONSTRUCTION_LOCK:
        if project_id in _ACTIVE_RECONSTRUCTIONS:
            return False
        _ACTIVE_RECONSTRUCTIONS.add(project_id)

    thread = threading.Thread(
        target=_run_reconstruction_worker,
        args=(project_id,),
        daemon=True,
        name=f"recon-{project_id[:8]}"
    )
    try:
        thread.start()
    except RuntimeError:
        with _RECONSTRUCTION_LOCK:
            _ACTIVE_RECONSTRUCTIONS.discard(project_id)
        raise
    return True
