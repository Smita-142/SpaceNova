"""
Project management router for SpaceNova API.
Endpoints: CRUD for projects.
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.models.schemas import ProjectCreate, ProjectResponse
from app.services import file_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _project_to_response(project: dict) -> dict:
    return project  # Already enriched by file_service


@router.get("", response_model=list)
async def list_projects():
    """List all projects sorted by creation date."""
    projects = file_service.list_projects()
    return projects


@router.post("", status_code=201)
async def create_project(body: ProjectCreate):
    """Create a new project and return its metadata."""
    project = file_service.create_project(name=body.name, description=body.description)
    return project


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get metadata for a specific project."""
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str):
    """Delete a project and all its files."""
    project = file_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    file_service.delete_project(project_id)
    return None
