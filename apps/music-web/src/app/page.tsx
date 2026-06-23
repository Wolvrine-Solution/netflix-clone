import { SubmitForm } from "@/components/SubmitForm";
import { Guitar, Music2, FileDown } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4 flex items-center gap-3">
        <Guitar className="text-brand-light w-6 h-6" />
        <span className="text-lg font-semibold tracking-tight">ChordGen</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          AI Chord & Tab Generator
        </span>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 gap-10">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Paste a song link.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-purple-300">
              Get chords instantly.
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            AI detects chords and aligns them to lyrics. Download a{" "}
            <span className="text-white font-medium">Guitar Pro file</span> ready
            to open in Guitar Pro app — or export as PDF.
          </p>
        </div>

        {/* Submit form */}
        <SubmitForm />

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {[
            { icon: Music2, label: "Chord detection with lyrics" },
            { icon: FileDown, label: "Guitar Pro .gp5 export" },
            { icon: Guitar, label: "Key & capo detection" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className="w-4 h-4 text-brand-light" />
              {label}
            </div>
          ))}
        </div>

        {/* Supported sources */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">Supports</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-muted-foreground">
            {["YouTube", "SoundCloud", "Bandcamp", "Direct MP3/WAV", "File Upload"].map(
              (src) => (
                <span
                  key={src}
                  className="glass rounded px-2 py-1"
                >
                  {src}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-surface-border px-6 py-4 text-center text-xs text-muted-foreground">
        ChordGen — open source chord detection &amp; Guitar Pro export
      </footer>
    </main>
  );
}
