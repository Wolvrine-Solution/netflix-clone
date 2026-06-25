"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChordChart } from "./ChordChart";
import { DownloadPanel } from "./DownloadPanel";
import { ProcessingProgress } from "./ProcessingProgress";
import { SongMeta } from "./SongMeta";
import { CapoSelector } from "./CapoSelector";
import { ThemeToggle } from "./ThemeToggle";
import { WaveformPlayer } from "./WaveformPlayer";
import type { SongResult } from "@/types";
import { transposeChord } from "@/lib/chords";

interface Props {
  jobId: string;
  initialStatus: string;
  initialData: SongResult | null;
}

export function ResultsClient({ jobId, initialStatus, initialData }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<SongResult | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [transpose, setTranspose] = useState(0);
  const [capo, setCapo] = useState(0);

  useEffect(() => {
    if (status === "completed" || status === "failed") return;

    const es = new EventSource(`/api/status/${jobId}`);

    es.onmessage = async (e) => {
      const payload = JSON.parse(e.data);
      setStatus(payload.status);
      setProgress(payload.progress ?? 0);

      if (payload.status === "completed") {
        const res = await fetch(`/api/results/${jobId}`);
        setData(await res.json());
        es.close();
      } else if (payload.status === "failed") {
        setError(payload.error ?? "Processing failed");
        es.close();
      }
    };

    es.onerror = () => {
      setError("Connection lost. Refresh to retry.");
      es.close();
    };

    return () => es.close();
  }, [jobId, status]);

  if (status === "failed" || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-surface-card to-surface-bg">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-4 border border-brand/20 shadow-xl shadow-brand/20">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-red-400 font-medium">{error ?? "Processing failed"}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-brand to-brand-dark text-white font-medium text-sm hover:shadow-md hover:shadow-brand/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            ← Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <ProcessingProgress status={status} progress={progress} />
      </div>
    );
  }

  // Effective transpose accounts for capo shift
  const effectiveTranspose = transpose - capo;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-surface-bg via-surface-card/50 to-surface-bg">
      {/* Top bar */}
      <header className="border-b border-brand/10 px-6 py-4 flex items-center gap-4 bg-gradient-to-r from-surface-card/60 to-surface-card/40 backdrop-blur-sm shadow-lg shadow-brand/5">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-brand-light hover:text-brand-glow transition-colors flex-shrink-0 font-medium"
        >
          ← ChordGen
        </button>
        <div className="flex-1 h-px bg-gradient-to-r from-brand/30 to-transparent" />
        <SongMeta
          meta={data.meta}
          transpose={transpose}
          onTransposeChange={setTranspose}
        />
        <ThemeToggle />
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Main chord chart */}
        <main className="flex-1 p-6 overflow-auto space-y-6">
          {data.meta.sourceUrl && (
            <WaveformPlayer audioUrl={`/api/audio/${jobId}`} />
          )}
          <ChordChart lines={data.lines} transpose={effectiveTranspose} />
        </main>

        {/* Sidebar */}
        <aside className="lg:w-80 border-t lg:border-t-0 lg:border-l border-brand/10 p-6 space-y-6 bg-gradient-to-b from-surface-elevated/40 to-surface-card/20">
          <div className="sticky top-6 space-y-6">
            <div className="glass rounded-xl p-4 border border-brand/20">
              <CapoSelector capo={capo} onChange={setCapo} />
            </div>
            <div className="h-px bg-gradient-to-r from-brand/30 via-brand/10 to-transparent" />
            <DownloadPanel jobId={jobId} meta={data.meta} />
          </div>
        </aside>
      </div>
    </div>
  );
}
