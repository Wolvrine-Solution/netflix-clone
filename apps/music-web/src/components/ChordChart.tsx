"use client";

import { transposeChord, CHORD_DIAGRAMS } from "@/lib/chords";
import type { ChordLine } from "@/types";
import { useState } from "react";
import { ChordDiagramTooltip } from "./ChordDiagramTooltip";

interface Props {
  lines: ChordLine[];
  transpose: number;
}

export function ChordChart({ lines, transpose }: Props) {
  const [hoveredChord, setHoveredChord] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-0">
      {lines.map((line, i) => {
        const hasChords = line.chords.length > 0;

        return (
          <div key={i} className="group">
            {/* Section header (verse, chorus, etc.) */}
            {line.section && (
              <div className="text-xs font-semibold text-brand-light uppercase tracking-widest mt-8 mb-1">
                [{line.section}]
              </div>
            )}

            {hasChords ? (
              <div className="relative leading-relaxed">
                {/* Chord row */}
                <div className="flex flex-wrap gap-x-0 font-mono text-sm mb-0.5 min-h-[1.4em]">
                  {renderChordRow(line, transpose, (chord) => setHoveredChord(chord))}
                </div>
                {/* Lyric row */}
                <div className="text-base text-zinc-200 tracking-wide">
                  {line.lyrics}
                </div>
              </div>
            ) : (
              <div className="text-base text-zinc-200 tracking-wide py-0.5">
                {line.lyrics || <span className="text-muted-foreground text-xs">&nbsp;</span>}
              </div>
            )}
          </div>
        );
      })}

      {hoveredChord && (
        <ChordDiagramTooltip
          chord={hoveredChord}
          onClose={() => setHoveredChord(null)}
        />
      )}
    </div>
  );
}

function renderChordRow(
  line: ChordLine,
  transpose: number,
  onHover: (chord: string) => void
) {
  const result: React.ReactNode[] = [];
  let cursor = 0;

  for (const { position, chord } of line.chords) {
    const transposed = transposeChord(chord, transpose);
    const spaces = position - cursor;
    if (spaces > 0) {
      result.push(
        <span key={`sp-${position}`} className="whitespace-pre">
          {" ".repeat(spaces)}
        </span>
      );
    }
    result.push(
      <span
        key={`ch-${position}`}
        className="chord-tag cursor-pointer hover:bg-brand/40 transition-colors"
        onMouseEnter={() => onHover(transposed)}
        onMouseLeave={() => onHover("")}
      >
        {transposed}
      </span>
    );
    cursor = position + transposed.length;
  }

  return result;
}
