import tempfile
import unittest
import os
import subprocess
from pathlib import Path
from unittest.mock import patch

from app.services import reconstruction_service


class ColmapCommandTests(unittest.TestCase):
    def test_uses_configured_executable_path(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            executable = Path(temp_dir) / "colmap.exe"
            executable.touch()

            with patch.dict(os.environ, {"COLMAP_EXECUTABLE": str(executable)}):
                self.assertEqual(
                    reconstruction_service.get_colmap_command(),
                    str(executable.resolve()),
                )

    def test_resolves_configured_command_from_path(self):
        with (
            patch.dict(os.environ, {"COLMAP_EXECUTABLE": "colmap"}),
            patch.object(reconstruction_service.shutil, "which", return_value="C:/tools/colmap.exe"),
        ):
            self.assertEqual(
                reconstruction_service.get_colmap_command(),
                "C:/tools/colmap.exe",
            )


class ColmapPipelineTests(unittest.TestCase):
    def test_runs_without_gpu_and_exports_sparse_model_as_ply(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            project_dir = root / "project"
            project_dir.mkdir()
            images = [project_dir / f"image_{index}.jpg" for index in range(3)]
            for image in images:
                image.write_bytes(b"image")

            recon_dir = root / "reconstruction"
            meta = {"id": "project-id"}

            def run_colmap(command, **_kwargs):
                if command[1] == "mapper":
                    model_dir = Path(command[command.index("--output_path") + 1]) / "0"
                    model_dir.mkdir()
                    (model_dir / "images.bin").touch()
                elif command[1] == "model_converter":
                    output_path = Path(command[command.index("--output_path") + 1])
                    output_path.write_bytes(b"ply")
                return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

            with (
                patch.object(reconstruction_service, "get_project_dir", return_value=project_dir),
                patch.object(reconstruction_service, "get_reconstruction_dir", return_value=recon_dir),
                patch.object(reconstruction_service, "list_project_images", return_value=images),
                patch.object(reconstruction_service, "load_project_meta", return_value=meta),
                patch.object(reconstruction_service, "save_project_meta"),
                patch.object(reconstruction_service, "COLMAP_COMMAND", "colmap"),
                patch.object(
                    reconstruction_service.subprocess, "run", side_effect=run_colmap
                ) as run,
            ):
                reconstruction_service.run_colmap_reconstruction("project-id")

            commands = [call.args[0] for call in run.call_args_list]
            self.assertIn("--FeatureExtraction.use_gpu", commands[0])
            self.assertEqual(
                commands[0][commands[0].index("--FeatureExtraction.use_gpu") + 1], "0"
            )
            self.assertIn("--FeatureMatching.use_gpu", commands[1])
            self.assertEqual(
                commands[1][commands[1].index("--FeatureMatching.use_gpu") + 1], "0"
            )
            self.assertEqual(commands[-1][1], "model_converter")
            self.assertTrue((recon_dir / "sparse_reconstruction.ply").is_file())
            self.assertEqual(meta["reconstruction_status"], "completed")
            self.assertTrue(meta["model_available"])


class FakeCapture:
    def __init__(self, frames, fps=30):
        self.frames = iter(frames)
        self.fps = fps
        self.released = False

    def isOpened(self):
        return True

    def get(self, property_id):
        return self.fps

    def read(self):
        frame = next(self.frames, None)
        return (frame is not None, frame)

    def release(self):
        self.released = True


class FakeOpenCV:
    CAP_PROP_FPS = 1
    IMWRITE_JPEG_QUALITY = 2

    def __init__(self, captures, write_success=True):
        self.captures = iter(captures)
        self.write_success = write_success
        self.writes = []

    def VideoCapture(self, _path):
        return next(self.captures)

    def imwrite(self, path, frame, _options):
        self.writes.append((path, frame))
        if self.write_success:
            Path(path).write_bytes(b"frame")
        return self.write_success


class ExtractFramesTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.project_dir = Path(self.temp_dir.name) / "project"
        self.project_dir.mkdir()
        self.cv2_patch = patch.object(reconstruction_service, "OPENCV_AVAILABLE", True)
        self.cv2_patch.start()
        self.addCleanup(self.cv2_patch.stop)
        self.dir_patch = patch.object(
            reconstruction_service, "get_project_dir", return_value=self.project_dir
        )
        self.dir_patch.start()
        self.addCleanup(self.dir_patch.stop)
        self.addCleanup(self.temp_dir.cleanup)

    def test_extracts_frames_at_requested_rate_and_releases_video(self):
        capture = FakeCapture(range(60), fps=30)
        cv2 = FakeOpenCV([capture])

        with patch.object(reconstruction_service, "cv2", cv2, create=True):
            count, error = reconstruction_service.extract_frames_from_video(
                "project-id", Path("room.mp4"), fps=2
            )

        self.assertIsNone(error)
        self.assertEqual(count, 4)
        self.assertEqual([frame for _, frame in cv2.writes], [0, 15, 30, 45])
        self.assertTrue(capture.released)
        self.assertTrue(all(Path(path).name.startswith("room.mp4_frame_") for path, _ in cv2.writes))

    def test_extracts_all_videos_without_overwriting_frames(self):
        captures = [FakeCapture([1, 2], fps=30), FakeCapture([3, 4], fps=30)]
        cv2 = FakeOpenCV(captures)
        videos = [Path("hallway.mp4"), Path("living-room.mov")]

        with (
            patch.object(reconstruction_service, "cv2", cv2, create=True),
            patch.object(reconstruction_service, "list_project_videos", return_value=videos),
        ):
            count, error = reconstruction_service.extract_all_project_frames(
                "project-id", fps=30
            )

        self.assertIsNone(error)
        self.assertEqual(count, 4)
        paths = [Path(path) for path, _ in cv2.writes]
        self.assertEqual(len({path.name for path in paths}), 4)
        self.assertEqual(
            {path.name.split("_frame_")[0] for path in paths},
            {"hallway.mp4", "living-room.mov"},
        )
        self.assertTrue(all(capture.released for capture in captures))

    def test_removes_stale_frames_when_reextracting_a_shorter_video(self):
        cv2 = FakeOpenCV([
            FakeCapture([1, 2, 3, 4], fps=30),
            FakeCapture([5, 6], fps=30),
        ])
        video_path = Path("room.mp4")

        with patch.object(reconstruction_service, "cv2", cv2, create=True):
            first_count, first_error = reconstruction_service.extract_frames_from_video(
                "project-id", video_path, fps=30
            )
            second_count, second_error = reconstruction_service.extract_frames_from_video(
                "project-id", video_path, fps=30
            )

        self.assertIsNone(first_error)
        self.assertIsNone(second_error)
        self.assertEqual((first_count, second_count), (4, 2))
        saved_frames = list((self.project_dir / "frames").glob("*.jpg"))
        self.assertEqual(len(saved_frames), 2)

    def test_rejects_fps_outside_supported_range_before_opening_video(self):
        cv2 = FakeOpenCV([])

        with patch.object(reconstruction_service, "cv2", cv2, create=True):
            count, error = reconstruction_service.extract_frames_from_video(
                "project-id", Path("room.mp4"), fps=0
            )

        self.assertEqual(count, 0)
        self.assertIn("between 0.1 and 30", error)
        self.assertEqual(cv2.writes, [])

    def test_releases_video_when_source_fps_is_invalid(self):
        capture = FakeCapture([1], fps=0)
        cv2 = FakeOpenCV([capture])

        with patch.object(reconstruction_service, "cv2", cv2, create=True):
            count, error = reconstruction_service.extract_frames_from_video(
                "project-id", Path("room.mp4")
            )

        self.assertEqual(count, 0)
        self.assertIn("could not determine FPS", error)
        self.assertTrue(capture.released)

    def test_reports_frame_write_failures_and_releases_video(self):
        capture = FakeCapture([1])
        cv2 = FakeOpenCV([capture], write_success=False)

        with patch.object(reconstruction_service, "cv2", cv2, create=True):
            count, error = reconstruction_service.extract_frames_from_video(
                "project-id", Path("room.mp4")
            )

        self.assertEqual(count, 0)
        self.assertIn("Could not write extracted frame", error)
        self.assertTrue(capture.released)


if __name__ == "__main__":
    unittest.main()
