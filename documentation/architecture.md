# SpaceNova — System Architecture

## Overview

SpaceNova follows a decoupled client-server architecture:

```
┌──────────────────────────────┐     HTTP/REST     ┌─────────────────────────────┐
│        Frontend (Vite)       │ ◄───────────────► │       Backend (FastAPI)      │
│   React + Three.js + R3F     │                   │   Python + OpenCV + COLMAP   │
│     http://localhost:5173    │                   │    http://localhost:8000     │
└──────────────────────────────┘                   └─────────────────────────────┘
                                                              │
                                                    ┌─────────────────────┐
                                                    │   Local Filesystem  │
                                                    │  uploads/           │
                                                    │  reconstructions/   │
                                                    └─────────────────────┘
```

## Frontend Architecture

### Pages (React Router)
- `/` → Landing
- `/dashboard` → Dashboard
- `/upload` → Capture & Upload
- `/reconstruction` → Reconstruction Workspace
- `/explorer` → 3D Explorer
- `/projects` → Project History
- `/settings` → Settings

### Component Hierarchy
```
App
└── BrowserRouter
    ├── Landing (no layout)
    └── Layout (Sidebar + Outlet)
        ├── Dashboard
        ├── Upload
        ├── Reconstruction
        ├── Explorer
        ├── Projects
        └── Settings
```

### State Management
- **Local component state** (useState, useReducer) for UI state
- **Custom hooks** (useProjects, useBackendStatus) for data fetching
- **No global state library** needed at this scale

### 3D Rendering Stack
```
React Three Fiber (React renderer for Three.js)
    └── @react-three/drei (Three.js helpers)
        ├── useGLTF (GLB/GLTF mesh loading)
        ├── PLYLoader (COLMAP sparse point-cloud loading)
        ├── OrbitControls (camera interaction)
        ├── Grid (floor grid)
        └── GizmoHelper (axis indicator)
```

## Backend Architecture

### Router Layer
```
app/main.py
├── routers/projects.py    → /api/projects (CRUD)
├── routers/media.py       → /api/projects/{id}/upload
└── routers/reconstruction.py → /api/projects/{id}/extract-frames
                               → /api/projects/{id}/reconstruct
                               → /api/projects/{id}/status
                               → /api/projects/{id}/model
```

### Service Layer
```
services/
├── file_service.py         → Project CRUD, metadata management
└── reconstruction_service.py → OpenCV frame extraction, COLMAP runner
```

### Utils Layer
```
utils/
└── file_utils.py          → Path management, validation, file I/O
```

### Storage Layout
```
backend/
├── uploads/
│   └── {project_id}/
│       ├── meta.json         ← Project metadata
│       ├── image1.jpg        ← Uploaded images
│       ├── video1.mp4        ← Uploaded videos
│       └── frames/
│           ├── frame_000000.jpg  ← Extracted frames
│           └── ...
└── reconstructions/
    └── {project_id}/
        ├── images/           ← Symlinked/copied for COLMAP
        ├── database.db       ← COLMAP feature database
        ├── sparse/           ← COLMAP SfM output
        ├── colmap.log        ← Processing log
        └── model.glb         ← Final 3D model (imported)
```

## Reconstruction Pipeline

```
POST /reconstruct
    │
    ▼
Check COLMAP available
    │
    ├─[No]─► Return 503 + instructions to import GLB/GLTF/PLY
    │
    └─[Yes]─► start_reconstruction_async(project_id)
                  │
                  ▼ (background thread)
              Collect images (uploads + frames) → images/
              colmap feature_extractor
              colmap exhaustive_matcher
              colmap mapper → sparse/
              Update meta.json status
```

## Security Considerations

- **Path traversal prevention**: All project IDs are validated as UUID format before use in file paths
- **File validation**: Extension and size checks on all uploads
- **CORS**: Restricted to configured frontend origins
- **No auth**: Prototype phase; authentication should be added before production

## Future Architecture Notes

For Round 2 features:

### POI System
```
POST /api/projects/{id}/pois  → Create POI
GET  /api/projects/{id}/pois  → List POIs
```
Store POIs in project meta.json as `{id, label, position: {x,y,z}, type, metadata}`

### Spatial Search
- Index POI labels in a simple in-memory search (Round 2)
- Future: vector embeddings for semantic search

### Pathfinding
- Extract floor mesh from 3D model
- Build navigation graph
- A* on graph nodes
- Visualize path in Three.js

### Multi-room Support
- Projects contain multiple "rooms" (sub-projects)
- Rooms linked by portals/doors
- Joint coordinate system using ICP alignment
