"""
Main processing pipeline: extract → analyze → lyrics → align → export
"""
import asyncio
import logging
from pathlib import Path

from .audio_extractor import AudioExtractor
from .chord_detector import ChordDetector
from .lyrics_fetcher import LyricsFetcher
from .chord_aligner import ChordAligner
from .guitarpro_generator import GuitarProGenerator
from .pdf_generator import PDFGenerator
from .job_store import update_job_status

logger = logging.getLogger(__name__)

OUTPUT_DIR = Path("./tmp/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


async def run_pipeline(job_id: str, source_url: str | None, file_key: str | None):
    try:
        # 1. Extract audio
        await update_job_status(job_id, "extracting", 10)
        extractor = AudioExtractor()
        audio_path, metadata = await extractor.extract(source_url, file_key)

        # 2. Detect chords
        await update_job_status(job_id, "analyzing", 30)
        detector = ChordDetector()
        chord_events = await asyncio.to_thread(detector.detect, audio_path)
        bpm, time_sig, key = await asyncio.to_thread(detector.analyze_tempo_key, audio_path)

        # 3. Fetch lyrics
        await update_job_status(job_id, "lyrics", 60)
        fetcher = LyricsFetcher()
        lyrics_lines = await fetcher.fetch(
            title=metadata.get("title"),
            artist=metadata.get("artist"),
            audio_path=audio_path,
        )

        # 4. Align chords to lyrics
        await update_job_status(job_id, "aligning", 75)
        aligner = ChordAligner()
        aligned_lines = aligner.align(chord_events, lyrics_lines)

        # 5. Generate Guitar Pro file
        await update_job_status(job_id, "exporting", 88)
        gp_gen = GuitarProGenerator()
        gp_path = OUTPUT_DIR / f"{job_id}.gp5"
        await asyncio.to_thread(
            gp_gen.generate,
            str(gp_path),
            aligned_lines,
            chord_events,
            bpm=bpm,
            key=key,
            time_sig=time_sig,
            title=metadata.get("title", ""),
            artist=metadata.get("artist", ""),
        )

        # 6. Generate PDF
        pdf_gen = PDFGenerator()
        pdf_path = OUTPUT_DIR / f"{job_id}.pdf"
        await asyncio.to_thread(
            pdf_gen.generate,
            str(pdf_path),
            aligned_lines,
            metadata,
            bpm=bpm,
            key=key,
        )

        # 7. Generate plain text
        txt_path = OUTPUT_DIR / f"{job_id}.txt"
        txt_path.write_text(_to_text(aligned_lines, metadata, bpm, key))

        result = {
            "meta": {
                "title": metadata.get("title"),
                "artist": metadata.get("artist"),
                "albumArt": metadata.get("thumbnail"),
                "bpm": bpm,
                "key": key,
                "timeSignature": time_sig,
                "sourceUrl": source_url,
            },
            "lines": aligned_lines,
            "rawChords": chord_events,
        }

        output_files = {
            "gp5": str(gp_path),
            "pdf": str(pdf_path),
            "txt": str(txt_path),
        }

        await update_job_status(
            job_id, "completed", 100,
            result=result,
            output_files=output_files,
        )

    except Exception as e:
        logger.exception("Pipeline failed for job %s", job_id)
        await update_job_status(job_id, "failed", 0, error=str(e))


def _to_text(lines: list, meta: dict, bpm: int | None, key: str | None) -> str:
    parts = []
    title = meta.get("title", "Unknown")
    artist = meta.get("artist", "")
    parts.append(f"{title}")
    if artist:
        parts.append(f"by {artist}")
    if key:
        parts.append(f"Key: {key}")
    if bpm:
        parts.append(f"BPM: {bpm}")
    parts.append("")

    for line in lines:
        if line.get("section"):
            parts.append(f"[{line['section']}]")
        if line.get("chords"):
            chord_row = ""
            for ch in line["chords"]:
                pos = ch["position"]
                while len(chord_row) < pos:
                    chord_row += " "
                chord_row += ch["chord"] + " "
            parts.append(chord_row.rstrip())
        parts.append(line.get("lyrics", ""))

    return "\n".join(parts)
