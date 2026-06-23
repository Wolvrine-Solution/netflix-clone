"""
Generates a printable PDF chord sheet using ReportLab.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from typing import Any


class PDFGenerator:
    def generate(
        self,
        output_path: str,
        aligned_lines: list[dict[str, Any]],
        meta: dict[str, Any],
        bpm: int | None = None,
        key: str | None = None,
    ) -> None:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )

        styles = getSampleStyleSheet()
        chord_style = ParagraphStyle(
            "Chord",
            fontName="Courier-Bold",
            fontSize=10,
            textColor=colors.HexColor("#7C3AED"),
            spaceAfter=0,
        )
        lyric_style = ParagraphStyle(
            "Lyric",
            fontName="Helvetica",
            fontSize=11,
            spaceAfter=4,
        )
        section_style = ParagraphStyle(
            "Section",
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=colors.HexColor("#888888"),
            spaceBefore=12,
            spaceAfter=2,
        )
        title_style = ParagraphStyle(
            "Title",
            fontName="Helvetica-Bold",
            fontSize=18,
            spaceAfter=2,
        )
        meta_style = ParagraphStyle(
            "Meta",
            fontName="Helvetica",
            fontSize=10,
            textColor=colors.grey,
            spaceAfter=12,
        )

        story = []

        title = meta.get("title", "Chord Chart")
        artist = meta.get("artist", "")
        story.append(Paragraph(title, title_style))

        meta_parts = []
        if artist:
            meta_parts.append(artist)
        if key:
            meta_parts.append(f"Key: {key}")
        if bpm:
            meta_parts.append(f"{bpm} BPM")
        if meta_parts:
            story.append(Paragraph("  ·  ".join(meta_parts), meta_style))

        story.append(Spacer(1, 6 * mm))

        for line in aligned_lines:
            if line.get("section"):
                story.append(Paragraph(f"[{line['section']}]", section_style))

            if line.get("chords"):
                chord_row = ""
                cursor = 0
                for ch in sorted(line["chords"], key=lambda x: x["position"]):
                    pos = ch["position"]
                    while len(chord_row) < pos:
                        chord_row += " "
                    chord_row += ch["chord"] + " "
                story.append(Paragraph(chord_row or " ", chord_style))

            lyrics = line.get("lyrics", "")
            story.append(Paragraph(lyrics or " ", lyric_style))

        doc.build(story)
