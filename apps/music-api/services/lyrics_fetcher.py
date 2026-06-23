"""
Fetches lyrics from Genius, Musixmatch, or transcribes via Whisper.
Returns a list of {time, text} dicts.
"""
import os
import re
import logging
from typing import Any

import lyricsgenius
import httpx

logger = logging.getLogger(__name__)


class LyricsFetcher:
    def __init__(self):
        self._genius = lyricsgenius.Genius(
            os.getenv("GENIUS_API_KEY", ""), quiet=True, skip_non_songs=True
        )
        self._mm_key = os.getenv("MUSIXMATCH_API_KEY", "")

    async def fetch(
        self,
        title: str | None,
        artist: str | None,
        audio_path: str | None = None,
    ) -> list[dict[str, Any]]:
        lyrics_text: str | None = None

        # 1. Try Genius
        if title and artist:
            try:
                song = self._genius.search_song(title, artist)
                if song and song.lyrics:
                    lyrics_text = song.lyrics
            except Exception as e:
                logger.warning("Genius failed: %s", e)

        # 2. Try Musixmatch
        if not lyrics_text and title and artist and self._mm_key:
            try:
                lyrics_text = await self._musixmatch(title, artist)
            except Exception as e:
                logger.warning("Musixmatch failed: %s", e)

        # 3. Whisper transcription fallback
        if not lyrics_text and audio_path and os.getenv("OPENAI_API_KEY"):
            try:
                lyrics_text = await self._whisper(audio_path)
            except Exception as e:
                logger.warning("Whisper failed: %s", e)

        if not lyrics_text:
            return []

        return self._parse_lyrics(lyrics_text)

    async def _musixmatch(self, title: str, artist: str) -> str | None:
        url = "https://api.musixmatch.com/ws/1.1/matcher.lyrics.get"
        params = {
            "q_track": title,
            "q_artist": artist,
            "apikey": self._mm_key,
            "format": "json",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, params=params)
            data = res.json()
        lyrics = (
            data.get("message", {})
            .get("body", {})
            .get("lyrics", {})
            .get("lyrics_body", "")
        )
        return lyrics or None

    async def _whisper(self, audio_path: str) -> str | None:
        from openai import AsyncOpenAI
        client = AsyncOpenAI()
        with open(audio_path, "rb") as f:
            transcript = await client.audio.transcriptions.create(
                model="whisper-1", file=f, response_format="text"
            )
        return str(transcript)

    def _parse_lyrics(self, raw: str) -> list[dict[str, Any]]:
        lines = []
        current_section = None

        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue

            section_match = re.match(r"^\[(.+?)\]$", line)
            if section_match:
                current_section = section_match.group(1)
                continue

            # Remove Genius annotations like "Embed", "You might also like", etc.
            if re.match(r"^(Embed|You might also like|\d+Embed)", line):
                continue

            lines.append({
                "lyrics": line,
                "section": current_section,
                "time": None,
            })

        return lines
