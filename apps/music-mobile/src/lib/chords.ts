const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLAT_MAP: Record<string, string> = {
  Db:"C#", Eb:"D#", Fb:"E", Gb:"F#", Ab:"G#", Bb:"A#", Cb:"B",
};

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  return chord.replace(/^([A-G][b#]?)/, (_, root) => {
    const normalized = FLAT_MAP[root] ?? root;
    const idx = CHROMATIC.indexOf(normalized);
    if (idx === -1) return root;
    return CHROMATIC[((idx + semitones) % 12 + 12) % 12];
  });
}

export interface ChordDiagram {
  frets: number[];
  fingers: number[];
  capo?: number;
}

export const CHORD_DIAGRAMS: Record<string, ChordDiagram> = {
  C:  { frets: [-1,3,2,0,1,0], fingers: [0,3,2,0,1,0] },
  G:  { frets: [3,2,0,0,0,3],  fingers: [2,1,0,0,0,3] },
  Am: { frets: [-1,0,2,2,1,0], fingers: [0,0,2,3,1,0] },
  Em: { frets: [0,2,2,0,0,0],  fingers: [0,2,3,0,0,0] },
  D:  { frets: [-1,-1,0,2,3,2],fingers: [0,0,0,1,3,2] },
  F:  { frets: [1,1,2,3,3,1],  fingers: [1,1,2,3,4,1], capo: 1 },
  E:  { frets: [0,2,2,1,0,0],  fingers: [0,2,3,1,0,0] },
  A:  { frets: [-1,0,2,2,2,0], fingers: [0,0,1,2,3,0] },
  Dm: { frets: [-1,-1,0,2,3,1],fingers: [0,0,0,2,3,1] },
  Bm: { frets: [-1,2,4,4,3,2], fingers: [0,1,3,4,2,1], capo: 2 },
  B:  { frets: [-1,2,4,4,4,2], fingers: [0,1,2,3,4,1], capo: 2 },
  Am7:{ frets: [-1,0,2,0,1,0], fingers: [0,0,2,0,1,0] },
  Em7:{ frets: [0,2,0,0,0,0],  fingers: [0,2,0,0,0,0] },
  G7: { frets: [3,2,0,0,0,1],  fingers: [3,2,0,0,0,1] },
};
