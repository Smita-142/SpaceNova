# SpaceNova — Capture Standard Operating Procedure (SOP)

## Purpose

This guide explains how to capture indoor environments using a smartphone for optimal 3D reconstruction results with SpaceNova.

---

## Equipment

- Any modern smartphone (iPhone, Android)
- Fully charged battery
- Clean lens
- Optional: tripod or gimbal for stable footage

---

## Photo Capture Guidelines

### Coverage Requirements
- **Minimum photos**: 30 (50+ recommended for large spaces)
- **Overlap**: 60–80% between consecutive photos
- **Multiple angles**: Capture each area from at least 3 different angles
- **Multiple heights**: Shoot from hip, eye, and above-head heights where possible

### Camera Settings
- Use the highest resolution available
- Disable HDR (causes motion artifacts)
- Enable grid lines for better framing
- Avoid digital zoom

### Lighting
- Use natural light where possible
- Ensure even illumination — avoid harsh shadows
- Turn on all room lights for indoor spaces
- Avoid shooting toward bright windows

### What to Avoid
- Motion blur (hold steady or use burst mode)
- Reflective surfaces (mirrors, glass, polished floors)
- Transparent objects
- Moving objects (people, fans)
- Identical textureless areas (plain white walls — add temporary markers)

### Capture Pattern

Walk the perimeter of the room:
1. Face inward and photograph every ~30–45° around the room
2. Move to the center and repeat
3. Photograph the ceiling and floor separately
4. Capture details like doorways, furniture, and corners with extra close-ups

---

## Video Capture Guidelines

### Settings
- Resolution: 1080p minimum (4K preferred)
- Frame rate: 30 fps
- Stabilization: ON (OIS or EIS)

### Walking Technique
- Walk slowly (0.3–0.5 m/s)
- Keep the phone steady — avoid shaking
- Maintain a consistent height
- Overlap areas by walking them twice from different angles

### Coverage Pattern
1. Walk the perimeter of the room (facing inward)
2. Walk diagonally across the room
3. Do a slow 360° rotation at the center
4. Capture alcoves, doorways, and corners with dedicated slow sweeps

### Video Length
- Small room (< 20 m²): 2–3 minutes
- Medium room (20–50 m²): 3–5 minutes
- Large room (> 50 m²): 5–10 minutes

---

## Frame Extraction (SpaceNova Automatic)

SpaceNova automatically extracts frames at 1 frame per second using OpenCV.

For a 3-minute video at 30 fps:
- Total source frames: ~5,400
- Extracted frames at 1 fps: ~180

This provides a good balance between coverage and processing time.

---

## Common Failure Causes

| Issue | Symptom | Solution |
|-------|---------|----------|
| Too few images | Reconstruction fails at matching | Capture more photos |
| Low texture | Poor feature matching | Add temporary markers to plain walls |
| Motion blur | Feature extraction fails | Hold phone steady, reduce speed |
| Bad lighting | Dark or washed-out images | Use more lights, avoid backlight |
| Too much movement | Inconsistent matching | Walk slower, use stabilization |

---

## After Capture

1. Upload to SpaceNova via `/upload`
2. Give the project a descriptive name
3. Go to `/reconstruction`
4. Extract frames (if using video)
5. Start reconstruction
6. Wait for COLMAP to process (5–30 min depending on image count and CPU)
7. Open the exported sparse PLY point cloud in `/explorer` and choose First Person to roam

The current CPU-compatible pipeline creates a sparse, colored point cloud, not
a dense textured mesh. Accurate results depend on sharp images with strong
overlap and visible texture across the whole space.

---

*Document version 1.0 — Team TechNova for Namma Space, Techfest IIT Bombay*
