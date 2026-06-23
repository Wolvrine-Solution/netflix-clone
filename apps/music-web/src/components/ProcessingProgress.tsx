"use client";

import { Loader2 } from "lucide-react";

const STEPS: Record<string, { label: string; pct: number }> = {
  queued:    { label: "Waiting in queue...", pct: 5 },
  extracting: { label: "Extracting audio...", pct: 20 },
  analyzing: { label: "Detecting chords...", pct: 50 },
  lyrics:    { label: "Fetching lyrics...", pct: 70 },
  aligning:  { label: "Aligning chords to lyrics...", pct: 85 },
  exporting: { label: "Generating Guitar Pro file...", pct: 95 },
  completed: { label: "Done!", pct: 100 },
};

interface Props {
  status: string;
  progress: number;
}

export function ProcessingProgress({ status, progress }: Props) {
  const step = STEPS[status] ?? { label: "Processing...", pct: progress };

  return (
    <div className="glass rounded-2xl p-8 max-w-md w-full space-y-6">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-brand-light" />
        <span className="font-medium">{step.label}</span>
      </div>

      <div className="space-y-2">
        <div className="h-2 bg-surface-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand to-purple-400 rounded-full transition-all duration-700"
            style={{ width: `${step.pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Hang tight — usually 30–60s</span>
          <span>{step.pct}%</span>
        </div>
      </div>

      <ol className="space-y-2">
        {Object.entries(STEPS)
          .filter(([k]) => k !== "completed")
          .map(([key, { label, pct }]) => {
            const done = step.pct > pct;
            const active = status === key;
            return (
              <li
                key={key}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  done
                    ? "text-brand-light"
                    : active
                    ? "text-white"
                    : "text-muted-foreground"
                }`}
              >
                <span className="w-3 h-3 rounded-full border flex-shrink-0" style={{
                  borderColor: done ? "#A78BFA" : active ? "#fff" : "#2E2E3D",
                  background: done ? "#7C3AED" : "transparent",
                }} />
                {label}
              </li>
            );
          })}
      </ol>
    </div>
  );
}
