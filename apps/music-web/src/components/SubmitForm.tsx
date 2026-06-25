"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Upload,
  X,
  Loader2,
  Music,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";

type InputMode = "url" | "file";

export function SubmitForm() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setMode("file");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res: Response;

      if (mode === "file" && file) {
        const form = new FormData();
        form.append("file", file);
        res = await fetch("/api/process", { method: "POST", body: form });
      } else {
        res = await fetch("/api/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Processing failed");
      }

      const { jobId } = await res.json();
      router.push(`/results/${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const disabled = loading || (mode === "url" ? !url : !file);

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      {/* Mode toggle */}
      <div className="glass relative flex gap-1 rounded-2xl p-1.5">
        {(["url", "file"] as InputMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx(
              "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-300",
              mode === m
                ? "bg-brand-gradient text-white shadow-glow"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {m === "url" ? (
              <>
                <Link2 className="h-4 w-4" /> Song URL
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Upload File
              </>
            )}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode === "url" ? (
        <div className="group relative">
          <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand-light" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            required
            className="glass w-full rounded-2xl py-4 pl-11 pr-12 text-sm transition-all duration-300 placeholder:text-muted-foreground/60 focus:border-brand/40 focus:shadow-glow focus:outline-none"
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300",
            dragging
              ? "border-brand bg-brand/10 shadow-glow"
              : "glass border-white/10 hover:border-brand/40"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/mp4"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 ring-1 ring-brand/20">
                <Music className="h-5 w-5 text-brand-light" />
              </div>
              <span className="max-w-[16rem] truncate text-sm font-medium">
                {file.name}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-muted-foreground transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 ring-1 ring-brand/20">
                <Upload className="h-6 w-6 text-brand-light" />
              </div>
              <p className="text-sm font-medium text-white">
                Drop a file or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                MP3, WAV, FLAC, M4A — max 50MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="animate-slide-up flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="btn-primary group flex w-full items-center justify-center gap-2 py-4 text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing audio...
          </>
        ) : (
          <>
            Generate Chord Chart
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
