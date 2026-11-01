# SpaceNova Sample Capture

This folder contains a compact, shareable sample capture for reproducing the
image-upload reconstruction workflow. The 12 JPEGs are evenly sampled frames
from an indoor video capture contributed by the SpaceNova team. The original
video is not included to keep the repository download small.

The team authorized these sample frames to be shared in this public repository
for competition evaluation and reproducibility. They depict an indoor home
environment. Please do not redistribute or reuse the images outside this
project without permission from the repository owner.

## Run it with the deployed application

1. Open the [SpaceNova web viewer](https://space-nova-three.vercel.app).
2. Go to **Capture & Upload** and create a project, for example
   `Sample House Reconstruction`.
3. Select all JPEG files from `test-data/house-sample/images/` and upload them
   as images.
4. Open **Reconstruction** for that project and start reconstruction.
5. Wait for the asynchronous COLMAP job to complete. CPU processing can take
   several minutes, depending on backend load.
6. Choose **Open in 3D Explorer** to inspect the resulting PLY point cloud.
   Use orbit controls to inspect it, or select **First Person** and click in
   the scene; move with WASD and press Escape to release the mouse.

The deployed application requires the Render backend and its persistent
storage to be available. The project currently produces a sparse point cloud,
not a dense textured mesh. Image sharpness, overlap, lighting, and scene
texture affect reconstruction quality.

## Verified environment

The included 12-image set was reconstructed successfully on Windows with
Python 3.11 and COLMAP 4.2.1 (CPU build). The run completed and exported a PLY
point cloud. Processing time depends on CPU performance and backend load; this
local verification does not guarantee a fixed duration on the hosted service.

## Run locally

1. Install Python 3.10 or later, Node.js 18 or later, and COLMAP. OpenCV is
   installed with the backend requirements.
2. In one terminal:

   ```powershell
   cd backend
   python -m pip install -r requirements.txt
   $env:COLMAP_EXECUTABLE = "C:\path\to\colmap.exe"
   uvicorn app.main:app --reload --port 8000
   ```

3. In a second terminal:

   ```powershell
   cd Frontend
   npm install
   $env:VITE_API_URL = "http://localhost:8000"
   npm run dev
   ```

4. Open <http://localhost:5173> and follow steps 2–6 above.

If COLMAP is already on `PATH`, the `COLMAP_EXECUTABLE` environment variable
can be omitted. On macOS or Linux, set it to the installed `colmap` executable
path as appropriate for the shell.
