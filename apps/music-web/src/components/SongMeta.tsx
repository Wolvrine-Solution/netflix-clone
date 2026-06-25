"use client";

import Image from "next/image";
import type { SongMeta as SongMetaType } from "@/types";
import { Music2 } from "lucide-react";

interface Props {
  meta: SongMetaType;
  transpose: number;
  onTransposeChange: (v: number) => void;
}

export function SongMeta({ meta, transpose, onTransposeChange }: Props) {
  return (
    <div className="flex-1 flex items-center gap-4 min-w-0">
      {meta.albumArt ? (
        <Image
          src={meta.albumArt}
          alt={meta.title ?? "Album art"}
          width={52}
          height={52}
          className="rounded-lg flex-shrink-0 object-cover shadow-md shadow-brand/20 ring-1 ring-brand/30"
        />
      ) : (
        <div className="w-13 h-13 rounded-lg bg-gradient-to-br from-brand/20 to-brand-light/10 flex items-center justify-center flex-shrink-0 border border-brand/20 shadow-md shadow-brand/15">
          <Music2 className="w-6 h-6 text-brand-light" />
        </div>
      )}

      <div className="min-w-0">
        <h1 className="font-semibold truncate text-lg">{meta.title ?? "Unknown Title"}</h1>
        <p className="text-sm text-muted-foreground truncate space-x-1">
          <span>{meta.artist}</span>
          {meta.bpm && <span className="text-brand-light">· {meta.bpm} BPM</span>}
          {meta.key && <span className="text-brand-light">· {meta.key}</span>}
          {meta.timeSignature && <span className="text-brand-light">· {meta.timeSignature}</span>}
        </p>
      </div>

      {/* Transpose control */}
      <div className="ml-auto flex-shrink-0 flex items-center gap-2 text-sm bg-surface-elevated/40 rounded-lg px-3 py-2 border border-brand/15">
        <span className="text-muted-foreground text-xs hidden sm:block font-medium uppercase tracking-wider">Transpose</span>
        <button
          onClick={() => onTransposeChange(Math.max(-6, transpose - 1))}
          className="glass w-7 h-7 rounded-md flex items-center justify-center hover:bg-brand/20 transition-colors text-brand-light font-bold"
        >
          −
        </button>
        <span className="w-6 text-center font-mono text-sm font-bold">
          {transpose > 0 ? `+${transpose}` : transpose}
        </span>
        <button
          onClick={() => onTransposeChange(Math.min(6, transpose + 1))}
          className="glass w-7 h-7 rounded-md flex items-center justify-center hover:bg-brand/20 transition-colors text-brand-light font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
