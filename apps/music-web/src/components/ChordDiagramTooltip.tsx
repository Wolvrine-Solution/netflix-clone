"use client";

import { CHORD_DIAGRAMS } from "@/lib/chords";

interface Props {
  chord: string;
  onClose: () => void;
}

export function ChordDiagramTooltip({ chord, onClose }: Props) {
  const diagram = CHORD_DIAGRAMS[chord];
  if (!diagram || !chord) return null;

  const { frets, fingers, capo, name } = diagram;
  const minFret = Math.min(...frets.filter((f) => f > 0));
  const maxFret = Math.max(...frets);
  const fretSpan = Math.max(4, maxFret - minFret + 1);
  const displayMin = capo ?? (minFret > 1 ? minFret : 1);

  return (
    <div
      className="fixed bottom-6 right-6 glass rounded-2xl p-5 shadow-2xl shadow-brand/40 z-50 min-w-[150px] border border-brand/30 backdrop-blur-xl"
      onMouseLeave={onClose}
    >
      <p className="text-center font-bold text-base mb-4 bg-gradient-to-r from-brand-light to-accent bg-clip-text text-transparent">{name ?? chord}</p>

      {/* Fretboard grid */}
      <svg width="110" height="120" viewBox="0 0 110 120" className="mx-auto block">
        {/* Nut or fret position label */}
        {displayMin <= 1 ? (
          <rect x="15" y="10" width="80" height="4" fill="#A78BFA" rx="1" />
        ) : (
          <text x="8" y="28" fontSize="10" fill="#A78BFA" fontWeight="bold" textAnchor="middle">
            {displayMin}fr
          </text>
        )}

        {/* Strings (vertical lines) */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={i}
            x1={15 + i * 16}
            y1={14}
            x2={15 + i * 16}
            y2={110}
            stroke="#2E2E3D"
            strokeWidth="1.5"
          />
        ))}

        {/* Frets (horizontal lines) */}
        {Array.from({ length: fretSpan + 1 }).map((_, i) => (
          <line
            key={i}
            x1={15}
            y1={14 + i * 20}
            x2={95}
            y2={14 + i * 20}
            stroke="#2E2E3D"
            strokeWidth="1.5"
          />
        ))}

        {/* Dots */}
        {frets.map((fret, string) => {
          const x = 15 + (5 - string) * 16;
          if (fret === -1) {
            return (
              <text key={string} x={x} y={8} fontSize="11" fill="#F472B6" fontWeight="bold" textAnchor="middle">
                ×
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={string} cx={x} cy={6} r={4.5} fill="none" stroke="#22D3EE" strokeWidth="2" />
            );
          }
          const y = 14 + (fret - displayMin + 0.5) * 20;
          return (
            <circle key={string} cx={x} cy={y} r={7.5} fill="#8B5CF6" />
          );
        })}
      </svg>

      {/* Finger numbers */}
      <div className="flex justify-between px-2 mt-3 pt-2 border-t border-brand/20">
        {[...fingers].reverse().map((f, i) => (
          <span key={i} className="text-[11px] font-bold text-brand-light w-4 text-center">
            {f > 0 ? f : "·"}
          </span>
        ))}
      </div>
    </div>
  );
}
