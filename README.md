# SpaceNova — Intelligent Indoor 3D Digital Twin Platform

> **Transforming Physical Spaces into Intelligent Digital Worlds**

Built by **Team TechNova** for the **Namma Space** competition organized by **Techfest, IIT Bombay**.

---

## Overview

SpaceNova converts smartphone-captured indoor environments (photos and videos) into interactive 3D digital twins viewable in the browser. The platform is designed for spatial exploration, future POI annotation, and indoor navigation.

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| Python | ≥ 3.10 |
| npm | ≥ 9.x |
| COLMAP | Optional (for reconstruction) |

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

The app will be available at: `http://localhost:5173`

---

## Online Demo Deployment

The frontend is deployed to Vercel and the FastAPI/COLMAP backend to Render.
The backend uses a persistent disk for uploads and generated models; do not
deploy it as a Vercel function because reconstruction and file storage require
a persistent process and filesystem.

1. Push this repository to GitHub.
2. In Render, create a Blueprint from the repository root using `render.yaml`.
   Set `CORS_ORIGINS` to the exact Vercel site origin, for example
   `https://your-project.vercel.app` (no trailing slash). Wait for the backend
   health check at `/api/health`.
3. In Vercel, import the repository and set the project root directory to
   `Frontend`. Set `VITE_API_URL` to the Render service origin, for example
   `https://spacenova-api.onrender.com` (no trailing slash), then deploy.
4. Open the Vercel URL, upload your capture to a project, run reconstruction,
   and share the project viewer link. Keep the Render persistent disk attached:
   uploads and reconstructions are stored there.

The Render service requires a paid instance with a persistent disk. COLMAP
runs on CPU in this deployment. Large reconstruction images are downscaled to a
maximum dimension of 2000 pixels before COLMAP processing. The live viewer URL
and GitHub repository URL are assigned by those services after deployment.

The submission-ready abstract is in
[documentation/technical-abstract.md](documentation/technical-abstract.md).
The capture procedure is in [documentation/capture-sop.md](documentation/capture-sop.md).
Reconstruction instructions for using your own authorized capture are in
[test-data/README.md](test-data/README.md). The Round 1 deliverables checklist
and link sheet are in
[documentation/round-1-submission-checklist.md](documentation/round-1-submission-checklist.md)
and [documentation/round-1-submission-links.md](documentation/round-1-submission-links.md).

---

## Project Structure

```
SpaceNova/
├── Frontend/               # React + Vite + Three.js frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages (Landing, Dashboard, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API client (Axios)
│   │   └── App.jsx
│   ├── public/
│   └── package.json
│
├── backend/                # FastAPI Python backend
│   ├── app/
│   │   ├── main.py         # App entry point
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── utils/          # File utilities
│   │   └── models/         # Pydantic schemas
│   ├── uploads/            # Uploaded media files
│   ├── reconstructions/    # COLMAP output + 3D models
│   └── requirements.txt
│
├── documentation/          # Architecture and SOPs
│   ├── architecture.md
│   └── capture-sop.md
│
└── README.md
```

---

## Application Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Brand page with feature overview |
| `/dashboard` | Dashboard | Project overview and quick actions |
| `/upload` | Capture & Upload | Drag-and-drop media upload |
| `/reconstruction` | Reconstruction | Frame extraction + COLMAP pipeline |
| `/explorer` | 3D Explorer | Interactive Three.js model viewer with orbit and first-person navigation |
| `/projects` | Projects | Project management |
| `/settings` | Settings | App info and backend status |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/{id}` | Get project details |
| DELETE | `/api/projects/{id}` | Delete project |
| POST | `/api/projects/{id}/upload` | Upload media files |
| POST | `/api/projects/{id}/extract-frames` | Extract video frames |
| POST | `/api/projects/{id}/reconstruct` | Start reconstruction |
| GET | `/api/projects/{id}/status` | Poll reconstruction status |
| GET | `/api/projects/{id}/model` | Get model URL |

---

## Technology Stack

**Frontend**
- React 18 + Vite 6
- Tailwind CSS 3
- React Router 6
- Three.js + React Three Fiber + Drei
- Lucide React Icons
- Axios

**Backend**
- Python 3.11
- FastAPI + Uvicorn
- OpenCV (frame extraction)
- Pydantic v2
- aiofiles

**3D Reconstruction**
- COLMAP (photogrammetry pipeline)
- OpenCV (video preprocessing)

---

## COLMAP Setup

COLMAP is required for 3D reconstruction. Without it, the platform still works for:
- Media upload and management
- Video frame extraction (requires OpenCV)
- Loading and exploring existing GLB/GLTF/PLY models

### Installing COLMAP

- **Windows**: Download from https://colmap.github.io/install.html
- **Ubuntu/Debian**: `sudo apt install colmap`
- **macOS**: `brew install colmap`

Cloning the COLMAP Git repository only downloads its source code; it does not
provide a runnable `colmap.exe`. Build the clone or install a prebuilt Windows
release, then set `COLMAP_EXECUTABLE` to the full path of the resulting
executable before starting the backend. For example, in PowerShell:

```powershell
$env:COLMAP_EXECUTABLE = "C:\path\to\colmap.exe"
cd backend
uvicorn app.main:app --reload --port 8000
```

If COLMAP is already on `PATH`, no additional setting is needed. The backend
checks the configured executable at startup.

---

## Reconstruction Workflow

```
Upload Photos/Video
        ↓
Extract Frames (OpenCV, 1 fps)
        ↓
Collect Images (uploaded + frames)
        ↓
COLMAP Feature Extraction
        ↓
COLMAP Exhaustive Matching
        ↓
COLMAP Sparse Reconstruction (SfM)
        ↓
Export sparse model to PLY point cloud
        ↓
Load PLY in 3D Explorer (orbit + first-person roaming)
```

The Windows no-CUDA COLMAP build runs feature extraction and matching in CPU
mode. The current pipeline produces a sparse point cloud for roaming; it does
not produce a dense, textured mesh.

---

## Features – Round 1

- [x] Project creation and management
- [x] Multi-image upload with drag-and-drop
- [x] Video upload with preview
- [x] OpenCV frame extraction
- [x] CPU-compatible COLMAP sparse reconstruction with PLY export
- [x] Interactive 3D viewer (GLB/GLTF)
- [x] COLMAP PLY point-cloud viewer
- [x] Orbit, pan, zoom controls
- [x] First-person WASD movement and mouse-look controls
- [x] Backend health monitoring
- [x] COLMAP availability detection
- [x] GLB/GLTF/PLY model import for testing

### Explorer controls

- **Orbit mode** (default): left-drag to rotate, right-drag to pan, scroll to zoom, and double-click to focus.
- **First Person mode**: click the 3D view to capture the mouse, use **W/A/S/D** to move, move the mouse to look around, and press **Esc** to release the mouse.
- Use **Reset** to restore the current mode's camera view.

### Focused tests

Run backend frame-extraction tests from `backend/` with `python -m unittest discover -s tests`, and frontend movement tests from `Frontend/` with `npm test`.

## Roadmap – Round 2

- [ ] POI (Point of Interest) tagging
- [ ] Spatial search and filtering
- [ ] Indoor mini-map
- [ ] A* pathfinding
- [ ] Obstacle detection
- [ ] Collision-aware navigation
- [ ] Emergency exit identification
- [ ] Distance measurement
- [ ] Multi-room digital twin support
- [ ] Dense reconstruction + meshing

---

## Environment Variables

### Frontend (`Frontend/.env`)
```
VITE_API_URL=http://localhost:8000
```

### Backend environment

Set these variables in the shell that starts the backend; the backend does not
load `backend/.env` automatically. In PowerShell:

```powershell
$env:CORS_ORIGINS = "http://localhost:5173,http://localhost:4173"
$env:COLMAP_EXECUTABLE = "C:\path\to\colmap.exe"
```

---

## Team TechNova

Built for the **Namma Space** competition  
**Techfest IIT Bombay**

---

*SpaceNova — Intelligent Spatial Engine*
