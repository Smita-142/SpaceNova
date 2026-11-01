# Round 1 Submission Checklist

Use this checklist to assemble and verify the Google Drive submission folder.
The competition brief asks for a viewable Drive link containing the technical
abstract, a working web-viewer proof of concept, a 3–5 minute demonstration
video, and the code repository with reconstruction instructions and sample data.

**Drive folder:** <https://drive.google.com/drive/folders/1KVtCjX_ipmhnvDd6SiHWemYTE9ycGm9j?usp=sharing>

## Submission folder

- [x] Create one Google Drive folder for the Round 1 submission.
- [x] Set sharing so the folder and demo video can be viewed from the shared link.
- [ ] Add the final deliverables listed below.
- [x] Confirm the shared folder link opens and lists the demo video.
- [ ] Submit the folder link, not an edit link or an individual file link.

## 1. Technical abstract (PDF, maximum 5 pages)

**Current source:** [technical-abstract.md](./technical-abstract.md)

- [ ] Review the abstract for accuracy against the final deployed application.
- [x] Keep it to five pages or fewer after exporting to PDF (verified: 2 pages).
- [x] Include the system architecture and frontend/backend responsibilities.
- [x] Explain capture, frame extraction, COLMAP feature matching and sparse
  reconstruction, and PLY export.
- [x] Describe the technical approach and the CPU/image-size trade-offs.
- [x] Clearly state the current output limitation: a sparse point cloud, not a
  dense textured mesh.
- [x] Add team/project identification and the competition name.
- [x] Export as `SpaceNova-Technical-Abstract.pdf` and verify the exported PDF
  has two pages and selectable text.
- [ ] Add the PDF to the Drive folder.

## 2. Proof of concept: working web viewer

**Primary frontend:** <https://space-nova-three.vercel.app>

**Backend health check:** <https://spacenova-w07b.onrender.com/api/health>

- [x] Frontend and backend are deployed separately (Vercel and Render).
- [x] Backend health endpoint responds successfully.
- [x] Browser API access works for the primary Vercel origin.
- [ ] Open the primary frontend URL in a private/incognito window and confirm
  the dashboard loads projects without a backend error.
- [ ] Confirm the Vercel deployment is the production deployment, not a
  protected branch-preview URL.
- [ ] Upload or select the intended demonstration project and confirm its
  model loads in the Explorer.
- [ ] Demonstrate orbit controls and First Person roaming (mouse look and WASD).
- [ ] Check the viewer on the browser/device that will be used for judging.
- [x] Copy the stable primary frontend URL into the abstract and link sheet.
- [ ] Add the frontend URL to the Drive folder README or submission notes.

## 3. Demonstration video (3–5 minutes)

- [ ] Record a 3–5 minute video with readable screen content and clear narration
  or captions.
- [ ] Introduce the project goal and the indoor space being demonstrated.
- [ ] Show the capture process and explain overlap, steady movement, lighting,
  and coverage.
- [ ] Show the captured photos/video being uploaded to a project.
- [ ] Show frame extraction when using video.
- [ ] Start reconstruction and explain that CPU processing may take time.
- [ ] Show the completed model in the web viewer.
- [ ] Demonstrate orbit viewing and first-person roaming.
- [ ] State honestly that the current generated result is a sparse point cloud,
  not a dense textured mesh.
- [ ] Avoid showing private addresses, faces, personal files, credentials, or
  other sensitive information.
- [ ] Export a common video format (MP4 recommended), play it back, and check
  audio, focus, and the final duration.
- [x] Add the demonstration video to the Drive folder, or add a viewable video link.

## 4. Code repository and reproducible reconstruction

**Repository:** <https://github.com/Smita-142/SpaceNova>

- [x] Repository is available on GitHub.
- [x] README contains local setup and online deployment instructions.
- [x] Capture SOP is available at [capture-sop.md](./capture-sop.md).
- [x] Architecture overview is available at [architecture.md](./architecture.md).
- [x] Add a `test-data/` directory with a small, team-authorized sample
  capture (images or a short video); do not include private home imagery without
  consent.
- [x] Add a README in `test-data/` describing the source, permission,
  contents, and recommended reconstruction steps.
- [ ] Verify a clean clone can follow the setup instructions and run the
  application.
- [x] Verify the sample capture can be processed using the documented
  reconstruction workflow (12 images; local COLMAP completed and exported PLY).
- [ ] Record the tested environment and any COLMAP/version requirements.
- [x] Confirm the sample consists only of the authorized images; no full source
  video, local uploads, or generated reconstruction output is included.
- [ ] Add the GitHub repository link to the Drive folder.

## Evaluation readiness

### SOP and pipeline soundness

- [x] Capture guidance covers overlap, movement, lighting, and coverage.
- [x] The application supports image upload, video frame extraction, and a
  COLMAP reconstruction pipeline.
- [x] Run one complete reconstruction on the sample capture; COLMAP completed
  and exported a PLY point cloud.
- [ ] Keep a short record of input counts, processing time, and any limitations
  encountered for use in the presentation.

### Visual quality and model fidelity

- [ ] Inspect the final model for coverage, alignment, obvious holes, and
  outliers before recording.
- [ ] Choose a capture with enough texture, overlap, and stationary objects to
  show the best representative result.
- [ ] Explain that sparse reconstruction is the current pipeline output; do not
  describe it as a textured mesh.

### Web viewer performance

- [x] The viewer includes orbit controls and first-person roaming.
- [ ] Verify model loading and navigation using the final deployment and sample
  project.
- [ ] Check that the selected model file size and point count remain usable on
  the demo device.

### Documentation and video clarity

- [x] A technical abstract draft, capture SOP, architecture document, and
  repository setup instructions exist.
- [ ] Add the PDF and links sheet to Drive; review the video duration and
  complete any remaining viewer checks.
- [ ] Check that document terminology and demo narration match actual
  application behavior.

## Final handoff

- [ ] Final Drive folder contains the abstract PDF, demo video, repository link,
  and primary web-viewer link.
- [ ] Folder and video permissions work for someone who is not signed in as a
  team member.
- [ ] Test every submitted link from a private/incognito browser window.
- [ ] Submit the single Drive folder link before the competition deadline.
