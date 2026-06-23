"""
Downloads audio from URLs (YouTube, SoundCloud, etc.) or reads uploaded files.
Outputs a normalized 22050 Hz mono WAV file.
"""
import asyncio
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import yt_dlp


UPLOAD_DIR = Path(os.getenv("STORAGE_LOCAL_PATH", "./tmp/audio"))
WORK_DIR = Path("./tmp/work")
WORK_DIR.mkdir(parents=True, exist_ok=True)


class AudioExtractor:
    async def extract(
        self, source_url: str | None, file_key: str | None
    ) -> tuple[str, dict[str, Any]]:
        if source_url:
            return await self._from_url(source_url)
        elif file_key:
            return await self._from_file(file_key)
        else:
            raise ValueError("Either source_url or file_key must be provided")

    async def _from_url(self, url: str) -> tuple[str, dict]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._download_url, url)

    def _download_url(self, url: str) -> tuple[str, dict]:
        out_path = str(WORK_DIR / "%(id)s.%(ext)s")
        metadata: dict = {}

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_path,
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "wav",
                    "preferredquality": "192",
                }
            ],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            metadata = {
                "title": info.get("title"),
                "artist": info.get("uploader") or info.get("artist"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
            }
            audio_file = ydl.prepare_filename(info).replace(
                f'.{info.get("ext", "webm")}', ".wav"
            )

        normalized = self._normalize(audio_file)
        return normalized, metadata

    async def _from_file(self, file_key: str) -> tuple[str, dict]:
        src = UPLOAD_DIR / file_key
        normalized = await asyncio.to_thread(self._normalize, str(src))
        return normalized, {"title": Path(file_key).stem}

    def _normalize(self, src: str) -> str:
        dst = str(WORK_DIR / (Path(src).stem + "_norm.wav"))
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", src,
                "-ac", "1",           # mono
                "-ar", "22050",       # 22050 Hz
                "-acodec", "pcm_s16le",
                dst,
            ],
            check=True,
            capture_output=True,
        )
        return dst
