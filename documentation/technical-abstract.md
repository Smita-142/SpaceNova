# SpaceNova Technical Abstract

## COLMAP-Based Indoor Reconstruction and Browser Roaming

SpaceNova is a web-based prototype for turning smartphone photos and video of
an indoor environment into a browser-viewable spatial reconstruction. Its
workflow combines a React and Three.js viewer with a FastAPI service, OpenCV
video-frame extraction, and COLMAP structure-from-motion processing. Users
create a project, add images or video, extract frames, and run a CPU-compatible
COLMAP pipeline. The resulting sparse reconstruction is exported as a PLY
point cloud and loaded in the web viewer, where users can inspect it with
orbit controls or navigate in first person using mouse-look and WASD controls.

The capture procedure emphasizes sharp images, consistent lighting, and
substantial overlap between successive viewpoints. These practices support
feature detection and image matching during reconstruction. The application
also supports GLB and GLTF models for comparison or alternate inputs.

The prototype demonstrates an end-to-end path from user-captured indoor media
to interactive online roaming. Its current output is a sparse point cloud,
not a dense, textured mesh; reconstruction quality depends on capture coverage,
surface texture, and image sharpness. The online deployment separates the
Vercel-hosted frontend from the API and COLMAP service, which uses persistent
storage for uploaded media and generated models.
