export interface ChordPosition {
  position: number;
  chord: string;
  time?: number;
  confidence?: number;
}

export interface ChordLine {
  lyrics: string;
  chords: ChordPosition[];
  section?: string;
  time?: number;
}

export interface SongMeta {
  title?: string;
  artist?: string;
  albumArt?: string;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  sourceUrl?: string;
}

export interface SongResult {
  meta: SongMeta;
  lines: ChordLine[];
  rawChords: Array<{ time: number; chord: string; confidence: number }>;
}

export type JobStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "lyrics"
  | "aligning"
  | "exporting"
  | "completed"
  | "failed";

export type RootStackParamList = {
  Home: undefined;
  Results: { jobId: string };
  Recording: undefined;
};
