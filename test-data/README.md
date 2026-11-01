# Reproducing a SpaceNova Reconstruction

Sample home images are intentionally not included in this repository. Use
photos or video that you own or have permission to process. The workflow below
reproduces the project pipeline with your own indoor capture.

## Run it with the deployed application

1. Open the [SpaceNova web viewer](https://space-nova-three.vercel.app).
2. Go to **Capture & Upload** and create a project.
3. Upload your own overlapping indoor photos or a short video.
4. Open **Reconstruction** for that project. If you uploaded a video, extract
   frames first; then start reconstruction.
5. Wait for the asynchronous COLMAP job to complete. CPU processing can take
   several minutes depending on the image count and backend load.
6. Choose **Open in 3D Explorer** to inspect the PLY point cloud. Use orbit
   controls, or select **First Person** and click the scene; move with WASD and
   press Escape to release the mouse.

The deployed application requires the Render backend and its persistent
storage to be available. The current pipeline produces a sparse point cloud,
not a dense textured mesh. Image sharpness, overlap, lighting, and scene
texture affect reconstruction quality. Follow the [capture SOP](../documentation/capture-sop.md)
for recommended capture practices.

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

4. Open <http://localhost:5173> and follow steps 2–6 above with your own media.

If COLMAP is already on `PATH`, the `COLMAP_EXECUTABLE` environment variable
can be omitted. On macOS or Linux, set it to the installed `colmap` executable
path as appropriate for the shell.
