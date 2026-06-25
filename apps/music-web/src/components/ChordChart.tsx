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
              <div className="text-xs font-semibold text-brand-light uppercase tracking-widest mt-8 mb-2 px-3 py-1 rounded-lg bg-surface-elevated/40 inline-block border border-brand/20">
                ♪ {line.section}
              </div>
            )}

            {hasChords ? (
              <div className="relative leading-relaxed p-3 rounded-lg bg-gradient-to-r from-surface-card/30 to-transparent hover:from-surface-elevated/20 transition-colors duration-300 my-1">
                {/* Chord row */}
                <div className="flex flex-wrap gap-x-0 font-mono text-sm mb-1 min-h-[1.4em]">
                  {renderChordRow(line, transpose, (chord) => setHoveredChord(chord))}
                </div>
                {/* Lyric row */}
                <div className="text-base text-zinc-200 tracking-wide">
                  {line.lyrics}
                </div>
              </div>
            ) : (
              <div className="text-base text-zinc-200 tracking-wide py-1 px-3">
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
        className="chord-tag cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-brand/50 hover:bg-gradient-to-r from-brand/50 to-brand-light/30 hover:-translate-y-0.5"
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
