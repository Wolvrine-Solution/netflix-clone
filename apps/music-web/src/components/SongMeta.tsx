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
          width={48}
          height={48}
          className="rounded-lg flex-shrink-0 object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
          <Music2 className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      <div className="min-w-0">
        <h1 className="font-semibold truncate">{meta.title ?? "Unknown Title"}</h1>
        <p className="text-sm text-muted-foreground truncate">
          {meta.artist}
          {meta.bpm && <span> · {meta.bpm} BPM</span>}
          {meta.key && <span> · Key of {meta.key}</span>}
          {meta.timeSignature && <span> · {meta.timeSignature}</span>}
        </p>
      </div>

      {/* Transpose control */}
      <div className="ml-auto flex-shrink-0 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs hidden sm:block">Transpose</span>
        <button
          onClick={() => onTransposeChange(Math.max(-6, transpose - 1))}
          className="glass w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-elevated transition-colors"
        >
          −
        </button>
        <span className="w-6 text-center font-mono text-sm">
          {transpose > 0 ? `+${transpose}` : transpose}
        </span>
        <button
          onClick={() => onTransposeChange(Math.min(6, transpose + 1))}
          className="glass w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-elevated transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
