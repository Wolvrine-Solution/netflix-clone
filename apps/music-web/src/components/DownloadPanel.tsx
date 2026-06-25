"use client";

import { useState } from "react";
import { FileDown, FileText, Music, Check, Link as LinkIcon } from "lucide-react";
import type { SongMeta } from "@/types";
import clsx from "clsx";

interface Props {
  jobId: string;
  meta: SongMeta;
}

const FORMATS = [
  {
    key: "gp5",
    label: "Guitar Pro",
    desc: "Opens in Guitar Pro 7/8",
    icon: Music,
    ext: ".gp5",
    tile: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  },
  {
    key: "pdf",
    label: "PDF Sheet",
    desc: "Print or share",
    icon: FileDown,
    ext: ".pdf",
    tile: "bg-rose-500/15 text-rose-400 ring-rose-500/20",
  },
  {
    key: "txt",
    label: "Plain Text",
    desc: "Chord sheet, raw",
    icon: FileText,
    ext: ".txt",
    tile: "bg-sky-500/15 text-sky-400 ring-sky-500/20",
  },
] as const;

export function DownloadPanel({ jobId, meta }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Download
        </h3>

        {FORMATS.map(({ key, label, desc, icon: Icon, ext, tile }) => (
          <a
            key={key}
            href={`/api/download/${jobId}?format=${key}`}
            download={`${meta.title ?? "chords"}${ext}`}
            className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-card/50 px-3.5 py-3 no-underline backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-surface-elevated"
          >
            <span
              className={clsx(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
                tile
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
            <FileDown className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-y-0.5 group-hover:text-brand-light" />
          </a>
        ))}
      </div>

      <div className="space-y-2.5 border-t border-white/[0.06] pt-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Share
        </h3>
        <button
          onClick={handleCopy}
          className={clsx(
            "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all duration-300",
            copied
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-white/[0.06] bg-surface-card/50 text-muted-foreground hover:border-brand/30 hover:text-white"
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Link copied!
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" /> Copy link to this chart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
