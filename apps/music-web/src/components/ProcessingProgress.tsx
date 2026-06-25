"use client";

import {
  Download,
  Music2,
  Mic2,
  ListMusic,
  AlignLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

const STEPS: {
  key: string;
  label: string;
  pct: number;
  icon: typeof Music2;
}[] = [
  { key: "queued", label: "Waiting in queue", pct: 5, icon: Loader2 },
  { key: "extracting", label: "Extracting audio", pct: 20, icon: Download },
  { key: "analyzing", label: "Detecting chords", pct: 50, icon: Music2 },
  { key: "lyrics", label: "Fetching lyrics", pct: 70, icon: Mic2 },
  { key: "aligning", label: "Aligning to lyrics", pct: 85, icon: AlignLeft },
  { key: "exporting", label: "Generating Guitar Pro", pct: 95, icon: ListMusic },
];

interface Props {
  status: string;
  progress: number;
}

export function ProcessingProgress({ status, progress }: Props) {
  const current =
    STEPS.find((s) => s.key === status) ??
    (status === "completed"
      ? { label: "Done!", pct: 100, icon: CheckCircle2, key: "completed" }
      : { label: "Processing", pct: progress, icon: Loader2, key: "queued" });

  return (
    <div className="glass-elevated animate-scale-in w-full max-w-md space-y-7 rounded-3xl p-8">
      {/* Pulsing icon */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
          <span className="absolute inset-0 rounded-full bg-brand/10" />
          <div className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-gradient shadow-glow">
            <current.icon
              className={clsx(
                "h-7 w-7 text-white",
                current.key !== "completed" && "animate-spin"
              )}
            />
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">{current.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hang tight — this usually takes 30–60 seconds
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2.5 overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full bg-brand-gradient bg-[length:200%_auto] shadow-glow transition-all duration-700 ease-out"
            style={{ width: `${current.pct}%` }}
          />
        </div>
        <div className="flex justify-end">
          <span className="font-mono text-xs text-brand-light">
            {current.pct}%
          </span>
        </div>
      </div>

      {/* Step list */}
      <ol className="space-y-1">
        {STEPS.map(({ key, label, pct, icon: Icon }) => {
          const done = current.pct > pct;
          const active = status === key;
          return (
            <li
              key={key}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300",
                active && "bg-brand/10",
                done
                  ? "text-brand-light"
                  : active
                  ? "text-white"
                  : "text-muted-foreground/60"
              )}
            >
              <span
                className={clsx(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-300",
                  done
                    ? "bg-brand text-white"
                    : active
                    ? "bg-brand/20 ring-1 ring-brand/40"
                    : "bg-surface-elevated"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Icon
                    className={clsx("h-3.5 w-3.5", active && "animate-spin")}
                  />
                )}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
