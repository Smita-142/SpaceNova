# SpaceNova Technical Abstract

## COLMAP-Based Indoor Reconstruction and Browser Roaming

**Team:** TechNova
**Competition:** Namma Space, Techfest IIT Bombay
**Web viewer:** <https://space-nova-three.vercel.app>
**Source repository:** <https://github.com/Smita-142/SpaceNova>

### Abstract

SpaceNova is a web-based prototype for turning smartphone photos and video of
an indoor environment into a browser-viewable 3D reconstruction. It combines a
React interface and Three.js viewer with a FastAPI backend, OpenCV
preprocessing, and COLMAP structure-from-motion (SfM). Users create a project,
upload images or video, extract video frames, and run reconstruction. The
resulting sparse point cloud can be inspected with orbit controls or explored
in first person using mouse-look and WASD movement.

### System architecture

The system separates the interactive client from the compute and storage
backend. The React/Vite frontend is deployed on Vercel. It calls a FastAPI
service deployed on Render for project management, media upload, frame
extraction, reconstruction status, and model delivery. The backend stores
uploads and reconstruction artifacts on persistent storage. OpenCV extracts
video frames, while COLMAP performs feature extraction, image matching, and
sparse mapping. The viewer loads the exported PLY point cloud; it can also load
GLB and GLTF models.

### Reconstruction pipeline and technical approach

The capture workflow targets sharp images with consistent lighting and
substantial overlap between successive viewpoints. Video input is sampled at
one frame per second by default. Before COLMAP processing, oversized staged
images are downscaled to a maximum dimension of 2000 pixels to reduce CPU and
memory costs; original uploaded media is retained. The CPU-compatible pipeline
then extracts image features, exhaustively matches image pairs, and runs the
COLMAP mapper to estimate camera poses and a sparse 3D structure. The sparse
model is exported as a PLY point cloud for browser viewing.

Reconstruction runs asynchronously on the backend, allowing the client to
poll job status and read progress logs while processing continues. Project
media and reconstruction outputs are stored separately from the frontend so
large uploads and generated models do not depend on a browser session.

### Browser visualization

The web viewer provides orbit-based inspection and first-person roaming. In
first-person mode, users click the scene to capture the mouse, use mouse
movement to look around, and use WASD to move; Escape releases the pointer.
Imported GLB/GLTF assets and COLMAP PLY outputs can be opened in the same
viewer.

### Evaluation considerations and limitations

The prototype demonstrates an end-to-end workflow from capture to online
roaming. Reconstruction quality depends on image sharpness, lighting, texture,
coverage, and overlap; reflective, transparent, moving, or textureless
surfaces can reduce feature matching quality. The current COLMAP output is a
sparse point cloud, not a dense, textured mesh. Processing runs on CPU, and
large captures can take several minutes depending on image count and backend
resources. These limits are surfaced so that the demo represents the current
system accurately.

### Reproducibility

The repository includes a compact, shareable sample capture and instructions
for uploading it, running frame/reconstruction processing, and opening the
result in the viewer. See [the sample-data guide](../test-data/README.md), the
[capture SOP](./capture-sop.md), and the [system architecture](./architecture.md).
The live viewer is available at
<https://space-nova-three.vercel.app>; the source is at
<https://github.com/Smita-142/SpaceNova>.
