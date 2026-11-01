"""
Pydantic schemas for SpaceNova API request/response models.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    image_count: int
    video_count: int
    extracted_frames: int
    reconstruction_status: str  # pending | processing | completed | failed | no_colmap
    model_available: bool
    error_message: Optional[str]


class ProjectStatusResponse(BaseModel):
    id: str
    reconstruction_status: str
    colmap_available: bool
    log_tail: Optional[str]
    error_message: Optional[str]
    model_available: bool


class ModelResponse(BaseModel):
    project_id: str
    model_available: bool
    model_url: Optional[str]
    model_filename: Optional[str]


class ExtractFramesRequest(BaseModel):
    fps: float = Field(default=1.0, ge=0.1, le=30.0)


class ExtractFramesResponse(BaseModel):
    project_id: str
    frame_count: int
    message: str


class ReconstructRequest(BaseModel):
    quality: str = Field(default="medium", pattern="^(low|medium|high)$")


class HealthResponse(BaseModel):
    status: str
    message: str
    version: str
    colmap_available: bool
    opencv_available: bool
