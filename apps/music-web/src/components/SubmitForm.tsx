"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Link2, Upload, X, Loader2, Music } from "lucide-react";
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

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl space-y-4"
    >
      {/* Mode toggle */}
      <div className="flex glass rounded-xl p-1 gap-1">
        {(["url", "file"] as InputMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              mode === m
                ? "bg-brand text-white shadow-lg shadow-brand/30"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {m === "url" ? (
              <><Link2 className="w-4 h-4" /> Song URL</>
            ) : (
              <><Upload className="w-4 h-4" /> Upload File</>
            )}
          </button>
        ))}
      </div>

      {/* Input area */}
      {mode === "url" ? (
        <div className="relative">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or any song link"
            required
            className="w-full glass rounded-xl px-4 py-4 pr-12 text-sm placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all"
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={clsx(
            "glass rounded-xl p-8 text-center cursor-pointer transition-all border-2 border-dashed",
            dragging ? "border-brand bg-brand/10" : "border-surface-border hover:border-brand/50"
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
              <Music className="w-5 h-5 text-brand-light" />
              <span className="text-sm font-medium">{file.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
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
        <p className="text-sm text-red-400 glass rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || (mode === "url" ? !url : !file)}
        className="w-full bg-brand hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-brand/30
                   hover:shadow-brand/50 flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          "Generate Chord Chart"
        )}
      </button>
    </form>
  );
}
