"""
Generates a Guitar Pro 5 (.gp5) file from aligned chord/lyric data.
Uses the PyGuitarPro library.
"""
import guitarpro
from guitarpro import models as gp
from typing import Any


CHORD_VOICINGS: dict[str, list[int]] = {
    "C":   [-1, 3, 2, 0, 1, 0],
    "C#":  [-1, 4, 3, 1, 2, -1],
    "D":   [-1, -1, 0, 2, 3, 2],
    "D#":  [-1, -1, 1, 3, 4, 3],
    "E":   [0, 2, 2, 1, 0, 0],
    "F":   [1, 1, 2, 3, 3, 1],
    "F#":  [2, 2, 3, 4, 4, 2],
    "G":   [3, 2, 0, 0, 0, 3],
    "G#":  [4, 3, 1, 1, 1, 4],
    "A":   [-1, 0, 2, 2, 2, 0],
    "A#":  [-1, 1, 3, 3, 3, 1],
    "B":   [-1, 2, 4, 4, 4, 2],
    "Cm":  [-1, 3, 5, 5, 4, 3],
    "C#m": [-1, 4, 6, 6, 5, 4],
    "Dm":  [-1, -1, 0, 2, 3, 1],
    "D#m": [-1, -1, 1, 3, 4, 2],
    "Em":  [0, 2, 2, 0, 0, 0],
    "Fm":  [1, 3, 3, 1, 1, 1],
    "F#m": [2, 4, 4, 2, 2, 2],
    "Gm":  [3, 5, 5, 3, 3, 3],
    "G#m": [4, 6, 6, 4, 4, 4],
    "Am":  [-1, 0, 2, 2, 1, 0],
    "A#m": [-1, 1, 3, 3, 2, 1],
    "Bm":  [-1, 2, 4, 4, 3, 2],
}

DEFAULT_VOICING = [0, 0, 0, 0, 0, 0]

BEATS_PER_MEASURE = 4
DEFAULT_BPM = 120


class GuitarProGenerator:
    def generate(
        self,
        output_path: str,
        aligned_lines: list[dict[str, Any]],
        chord_events: list[dict[str, Any]],
        bpm: int = DEFAULT_BPM,
        key: str = "C",
        time_sig: str = "4/4",
        title: str = "",
        artist: str = "",
    ) -> None:
        song = gp.Song()
        song.title = title
        song.artist = artist
        song.tempo = bpm

        # Set time signature
        num, denom = map(int, (time_sig or "4/4").split("/"))

        # Build chord list (deduplicated, preserving order)
        chord_sequence = self._build_chord_sequence(aligned_lines)

        # Create rhythm guitar track
        track = song.tracks[0]
        track.name = "Rhythm Guitar"
        track.channel.instrument = 25  # Acoustic Guitar (steel)
        track.measures = []

        measures_per_chord = 1
        for chord_name in chord_sequence:
            measure = gp.Measure(track, gp.MeasureHeader())
            measure.header.timeSignature.numerator = num
            measure.header.timeSignature.denominator.value = denom

            voice = measure.voices[0]
            voice.beats = []

            voicing = CHORD_VOICINGS.get(chord_name, DEFAULT_VOICING)

            for beat_i in range(num):
                beat = gp.Beat(voice)
                beat.duration = gp.Duration(value=4)  # quarter note

                for string_idx, fret in enumerate(voicing):
                    if fret >= 0:
                        note = gp.Note(beat)
                        note.string = string_idx + 1
                        note.value = fret
                        note.velocity = 95 if beat_i == 0 else 80
                        beat.notes.append(note)

                # Chord name on first beat
                if beat_i == 0 and chord_name:
                    beat.effect.chord = gp.Chord(6)
                    beat.effect.chord.name = chord_name
                    frets = voicing[:]
                    for i, f in enumerate(frets):
                        if i < len(beat.effect.chord.strings):
                            beat.effect.chord.strings[i] = f

                voice.beats.append(beat)

            track.measures.append(measure)

        guitarpro.write(song, output_path)

    def _build_chord_sequence(self, aligned_lines: list[dict]) -> list[str]:
        chords = []
        for line in aligned_lines:
            for chord_pos in line.get("chords", []):
                chord = chord_pos.get("chord", "")
                if chord and (not chords or chords[-1] != chord):
                    chords.append(chord)
        return chords or ["C"]
