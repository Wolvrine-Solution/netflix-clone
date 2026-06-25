"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  audioUrl?: string;
  onTimeUpdate?: (time: number) => void;
}

export function WaveformPlayer({ audioUrl, onTimeUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return;

    let ws: any;

    import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: "#2E2E3D",
        progressColor: "#7C3AED",
        cursorColor: "#A78BFA",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 64,
        normalize: true,
      });

      ws.load(audioUrl);

      ws.on("ready", () => {
        setDuration(ws.getDuration());
        setLoaded(true);
        wavesurferRef.current = ws;
      });

      ws.on("timeupdate", (t: number) => {
        setCurrentTime(t);
        onTimeUpdate?.(t);
      });

      ws.on("finish", () => setPlaying(false));
    });

    return () => ws?.destroy();
  }, [audioUrl]);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
    setPlaying((p) => !p);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (!audioUrl) return null;

  return (
    <div className="glass rounded-xl p-4 space-y-4 border border-brand/20 shadow-lg shadow-brand/20">
      <div ref={containerRef} className="w-full" />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!loaded}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-dark hover:shadow-md hover:shadow-brand/40 disabled:opacity-40 flex items-center justify-center transition-all duration-200 flex-shrink-0 hover:-translate-y-0.5"
        >
          {playing ? (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
              <rect x="0" y="0" width="4" height="14" rx="1" />
              <rect x="8" y="0" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
              <path d="M0 0L12 7L0 14V0Z" />
            </svg>
          )}
        </button>

        <span className="text-xs font-mono text-muted-foreground font-medium">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
