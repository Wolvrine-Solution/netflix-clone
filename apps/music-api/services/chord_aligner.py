"""
Aligns timed chord events to lyric lines using a uniform-time heuristic
and optional DTW refinement when lyric timestamps are available.
"""
from typing import Any
import math


class ChordAligner:
    def align(
        self,
        chord_events: list[dict[str, Any]],
        lyrics_lines: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        if not chord_events or not lyrics_lines:
            return [
                {"lyrics": line.get("lyrics", ""), "section": line.get("section"), "chords": []}
                for line in lyrics_lines
            ]

        total_duration = chord_events[-1]["time"] if chord_events else 0
        n_lines = len(lyrics_lines)
        line_duration = total_duration / n_lines if n_lines else 0

        aligned = []
        for i, line in enumerate(lyrics_lines):
            line_start = i * line_duration
            line_end = (i + 1) * line_duration

            chords_in_line = [
                e for e in chord_events
                if line_start <= e["time"] < line_end
            ]

            chord_positions = self._to_positions(chords_in_line, line_start, line_duration, line.get("lyrics", ""))

            aligned.append({
                "lyrics": line.get("lyrics", ""),
                "section": line.get("section"),
                "chords": chord_positions,
                "time": line_start,
            })

        return aligned

    def _to_positions(
        self,
        events: list[dict],
        line_start: float,
        line_duration: float,
        lyrics: str,
    ) -> list[dict]:
        if not events or not lyrics:
            return []

        line_len = max(len(lyrics), 1)
        positions = []
        seen_chords: set[str] = set()

        for event in events:
            if event["chord"] in seen_chords:
                continue
            frac = (event["time"] - line_start) / line_duration if line_duration else 0
            pos = int(frac * line_len)
            pos = max(0, min(pos, line_len - 1))
            positions.append({
                "position": pos,
                "chord": event["chord"],
                "time": event["time"],
                "confidence": event.get("confidence", 1.0),
            })
            seen_chords.add(event["chord"])

        positions.sort(key=lambda x: x["position"])
        return positions
