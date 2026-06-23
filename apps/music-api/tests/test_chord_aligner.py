import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.chord_aligner import ChordAligner


def test_align_basic():
    aligner = ChordAligner()
    chord_events = [
        {"time": 0.0, "chord": "C", "confidence": 0.9},
        {"time": 5.0, "chord": "G", "confidence": 0.85},
        {"time": 10.0, "chord": "Am", "confidence": 0.9},
    ]
    lyrics = [
        {"lyrics": "Hello world", "section": "Verse 1", "time": None},
        {"lyrics": "Goodbye friend", "section": None, "time": None},
        {"lyrics": "See you later", "section": None, "time": None},
    ]
    result = aligner.align(chord_events, lyrics)
    assert len(result) == 3
    assert result[0]["lyrics"] == "Hello world"
    assert result[0]["section"] == "Verse 1"


def test_align_empty_chords():
    aligner = ChordAligner()
    lyrics = [{"lyrics": "Some text", "section": None, "time": None}]
    result = aligner.align([], lyrics)
    assert result[0]["chords"] == []


def test_align_empty_lyrics():
    aligner = ChordAligner()
    chords = [{"time": 0.0, "chord": "C", "confidence": 0.9}]
    result = aligner.align(chords, [])
    assert result == []


def test_chord_positions_within_bounds():
    aligner = ChordAligner()
    chord_events = [{"time": 0.0, "chord": "C", "confidence": 0.9}]
    lyrics = [{"lyrics": "Hello", "section": None, "time": None}]
    result = aligner.align(chord_events, lyrics)
    for chord_pos in result[0]["chords"]:
        assert 0 <= chord_pos["position"] < len("Hello")
