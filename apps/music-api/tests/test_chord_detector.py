"""
Unit tests for chord detection logic.
Tests template matching and key estimation without real audio.
"""
import numpy as np
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.chord_detector import ChordDetector, TEMPLATES


def _make_chroma(chord: str, noise: float = 0.05) -> np.ndarray:
    """Synthesize a chroma frame for a given chord."""
    template = TEMPLATES[chord].copy()
    template += np.random.RandomState(42).uniform(0, noise, 12)
    return template / np.linalg.norm(template)


class TestTemplateMatching:
    def setup_method(self):
        self.detector = ChordDetector()

    def test_detects_c_major(self):
        chroma = _make_chroma("C").reshape(12, 1)
        times = np.array([0.0])
        results = self.detector._template_match(chroma, times)
        assert results[0]["chord"] == "C"

    def test_detects_am(self):
        chroma = _make_chroma("Am").reshape(12, 1)
        times = np.array([0.0])
        results = self.detector._template_match(chroma, times)
        assert results[0]["chord"] == "Am"

    def test_detects_g(self):
        chroma = _make_chroma("G").reshape(12, 1)
        times = np.array([0.0])
        results = self.detector._template_match(chroma, times)
        assert results[0]["chord"] == "G"

    def test_confidence_between_0_and_1(self):
        chroma = _make_chroma("D").reshape(12, 1)
        times = np.array([0.0])
        results = self.detector._template_match(chroma, times)
        assert 0 <= results[0]["confidence"] <= 1.0

    def test_collapses_consecutive_same_chord(self):
        events = [
            {"time": 0.0, "chord": "C", "confidence": 0.9},
            {"time": 1.0, "chord": "C", "confidence": 0.85},
            {"time": 2.0, "chord": "G", "confidence": 0.9},
            {"time": 3.0, "chord": "G", "confidence": 0.88},
        ]
        collapsed = self.detector._collapse_consecutive(events)
        assert len(collapsed) == 2
        assert collapsed[0]["chord"] == "C"
        assert collapsed[1]["chord"] == "G"

    def test_smooth_hmm_majority_vote(self):
        events = [
            {"time": t, "chord": c, "confidence": 0.9}
            for t, c in [
                (0.0, "C"), (0.5, "Am"), (1.0, "C"), (1.5, "C"), (2.0, "C"),
            ]
        ]
        smoothed = self.detector._smooth_hmm(events)
        assert smoothed[2]["chord"] == "C"


class TestKeyEstimation:
    def setup_method(self):
        self.detector = ChordDetector()

    def test_c_major_key(self):
        profile_major = np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88])
        chroma = np.tile(profile_major.reshape(12, 1), (1, 10))
        key_idx, mode = self.detector._estimate_key(chroma)
        assert key_idx == 0
        assert mode == "major"

    def test_a_minor_key(self):
        profile_minor = np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
        shifted = np.roll(profile_minor, -9)
        chroma = np.tile(shifted.reshape(12, 1), (1, 10))
        key_idx, mode = self.detector._estimate_key(chroma)
        assert key_idx == 9
        assert mode == "minor"
