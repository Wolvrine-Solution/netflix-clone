"""
Chord detection using librosa chroma features + template matching + HMM smoothing.
"""
import numpy as np
import librosa
from typing import Any


CHORD_TEMPLATES: dict[str, list[int]] = {
    "C":  [1,0,0,0,1,0,0,1,0,0,0,0],
    "C#": [0,1,0,0,0,1,0,0,1,0,0,0],
    "D":  [0,0,1,0,0,0,1,0,0,1,0,0],
    "D#": [0,0,0,1,0,0,0,1,0,0,1,0],
    "E":  [0,0,0,0,1,0,0,0,1,0,0,1],
    "F":  [1,0,0,0,0,1,0,0,0,1,0,0],
    "F#": [0,1,0,0,0,0,1,0,0,0,1,0],
    "G":  [0,0,1,0,0,0,0,1,0,0,0,1],
    "G#": [1,0,0,1,0,0,0,0,1,0,0,0],
    "A":  [0,1,0,0,1,0,0,0,0,1,0,0],
    "A#": [0,0,1,0,0,1,0,0,0,0,1,0],
    "B":  [0,0,0,1,0,0,1,0,0,0,0,1],
    "Cm": [1,0,0,1,0,0,0,1,0,0,0,0],
    "C#m":[0,1,0,0,1,0,0,0,1,0,0,0],
    "Dm": [0,0,1,0,0,1,0,0,0,1,0,0],
    "D#m":[0,0,0,1,0,0,1,0,0,0,1,0],
    "Em": [0,0,0,0,1,0,0,1,0,0,0,1],
    "Fm": [1,0,0,0,0,1,0,0,1,0,0,0],
    "F#m":[0,1,0,0,0,0,1,0,0,1,0,0],
    "Gm": [0,0,1,0,0,0,0,1,0,0,1,0],
    "G#m":[1,0,0,1,0,0,0,0,1,0,0,1],
    "Am": [1,0,0,1,0,0,0,1,0,0,0,0],
    "A#m":[0,1,0,0,1,0,0,0,1,0,0,0],
    "Bm": [0,0,1,0,0,1,0,0,0,1,0,0],
}

TEMPLATES = {
    k: np.array(v, dtype=float) / np.linalg.norm(v)
    for k, v in CHORD_TEMPLATES.items()
}

HOP_LENGTH = 2048
N_FFT = 4096


class ChordDetector:
    def detect(self, audio_path: str) -> list[dict[str, Any]]:
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

        chroma = librosa.feature.chroma_cqt(
            y=y, sr=sr, hop_length=HOP_LENGTH, bins_per_octave=36
        )

        times = librosa.frames_to_time(
            np.arange(chroma.shape[1]), sr=sr, hop_length=HOP_LENGTH
        )

        raw_chords = self._template_match(chroma, times)
        smoothed = self._smooth_hmm(raw_chords)
        collapsed = self._collapse_consecutive(smoothed)

        return collapsed

    def analyze_tempo_key(self, audio_path: str) -> tuple[int, str, str]:
        y, sr = librosa.load(audio_path, sr=22050, mono=True)

        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        bpm = int(round(float(np.atleast_1d(tempo)[0])))

        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_idx, mode = self._estimate_key(chroma)
        key_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        key = key_names[key_idx] + ("m" if mode == "minor" else "")

        return bpm, "4/4", key

    def _template_match(self, chroma: np.ndarray, times: np.ndarray) -> list[dict]:
        results = []
        for i, frame in enumerate(chroma.T):
            norm = np.linalg.norm(frame)
            if norm < 1e-6:
                continue
            frame_norm = frame / norm
            best_chord = max(TEMPLATES, key=lambda c: np.dot(TEMPLATES[c], frame_norm))
            confidence = float(np.dot(TEMPLATES[best_chord], frame_norm))
            results.append({
                "time": float(times[i]),
                "chord": best_chord,
                "confidence": round(confidence, 3),
            })
        return results

    def _smooth_hmm(self, events: list[dict]) -> list[dict]:
        if len(events) < 3:
            return events
        chords = [e["chord"] for e in events]
        smoothed = []
        window = 5
        chord_list = list(TEMPLATES.keys())
        for i, event in enumerate(events):
            start = max(0, i - window // 2)
            end = min(len(chords), i + window // 2 + 1)
            window_chords = chords[start:end]
            counts = {c: window_chords.count(c) for c in set(window_chords)}
            most_common = max(counts, key=counts.__getitem__)
            smoothed.append({**event, "chord": most_common})
        return smoothed

    def _collapse_consecutive(self, events: list[dict]) -> list[dict]:
        if not events:
            return []
        collapsed = [events[0]]
        for event in events[1:]:
            if event["chord"] != collapsed[-1]["chord"]:
                collapsed.append(event)
        return collapsed

    def _estimate_key(self, chroma: np.ndarray) -> tuple[int, str]:
        profile_major = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
        profile_minor = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])

        mean_chroma = chroma.mean(axis=1)
        best_key, best_mode, best_score = 0, "major", -np.inf

        for shift in range(12):
            shifted = np.roll(mean_chroma, -shift)
            major_score = np.corrcoef(shifted, profile_major)[0, 1]
            minor_score = np.corrcoef(shifted, profile_minor)[0, 1]
            if major_score > best_score:
                best_score, best_key, best_mode = major_score, shift, "major"
            if minor_score > best_score:
                best_score, best_key, best_mode = minor_score, shift, "minor"

        return best_key, best_mode
