"use client";

import { FileDown, FileText, Music } from "lucide-react";
import type { SongMeta } from "@/types";

interface Props {
  jobId: string;
  meta: SongMeta;
}

const FORMATS = [
  {
    key: "gp5",
    label: "Guitar Pro",
    desc: "Open in Guitar Pro 7/8",
    icon: Music,
    ext: ".gp5",
    accent: "text-green-400",
  },
  {
    key: "pdf",
    label: "PDF",
    desc: "Print or share",
    icon: FileDown,
    ext: ".pdf",
    accent: "text-red-400",
  },
  {
    key: "txt",
    label: "Plain Text",
    desc: "Chord sheet, no formatting",
    icon: FileText,
    ext: ".txt",
    accent: "text-blue-400",
  },
] as const;

export function DownloadPanel({ jobId, meta }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
        Download
      </h3>

      <div className="space-y-2">
        {FORMATS.map(({ key, label, desc, icon: Icon, ext, accent }) => (
          <a
            key={key}
            href={`/api/download/${jobId}?format=${key}`}
            download={`${meta.title ?? "chords"}${ext}`}
            className="flex items-center gap-3 glass rounded-xl px-4 py-3 hover:bg-surface-elevated
                       transition-all group cursor-pointer no-underline"
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${accent}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <FileDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
          </a>
        ))}
      </div>

      <div className="border-t border-surface-border pt-4 space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Share
        </h3>
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="w-full glass rounded-xl px-4 py-3 text-sm text-muted-foreground
                     hover:text-white hover:bg-surface-elevated transition-all text-left"
        >
          Copy link to this chart
        </button>
      </div>
    </div>
  );
}
