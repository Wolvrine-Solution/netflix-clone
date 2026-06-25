import { SubmitForm } from "@/components/SubmitForm";
import {
  Guitar,
  Music2,
  FileDown,
  KeyRound,
  Sparkles,
  Github,
  Youtube,
  CloudUpload,
  Waves,
} from "lucide-react";

const FEATURES = [
  {
    icon: Music2,
    title: "Chord detection",
    desc: "AI listens and maps every chord change, aligned to the lyrics.",
  },
  {
    icon: FileDown,
    title: "Guitar Pro export",
    desc: "Download a clean .gp5 file that opens flawlessly in Guitar Pro.",
  },
  {
    icon: KeyRound,
    title: "Key & capo",
    desc: "Auto-detects the key, suggests capo positions, transpose on the fly.",
  },
];

const SOURCES = [
  { icon: Youtube, label: "YouTube" },
  { icon: Waves, label: "SoundCloud" },
  { icon: Music2, label: "Bandcamp" },
  { icon: FileDown, label: "MP3 / WAV" },
  { icon: CloudUpload, label: "Upload" },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Decorative floating orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -left-20 h-72 w-72 rounded-full bg-brand/20 blur-[100px] animate-float"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-16 h-80 w-80 rounded-full bg-accent/10 blur-[120px] animate-float-slow"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
            <Guitar className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            ChordGen
          </span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-white"
        >
          <Github className="h-4 w-4" />
          <span className="hidden sm:inline">Star on GitHub</span>
        </a>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center gap-12 px-4 py-12 sm:py-20">
        {/* Grid backdrop */}
        <div
          aria-hidden
          className="grid-backdrop pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        />

        <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
          {/* Eyebrow badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Powered by audio AI — chords in seconds
          </div>

          <h1 className="animate-slide-up font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Paste a song link.
            <br />
            <span className="text-gradient-brand">Get chords instantly.</span>
          </h1>

          <p className="animate-slide-up animation-delay-200 max-w-xl text-lg leading-relaxed text-muted-foreground">
            AI detects chords and aligns them to lyrics. Download a{" "}
            <span className="font-medium text-white">Guitar Pro file</span> ready
            to open — or export as PDF.
          </p>
        </div>

        {/* Submit form */}
        <div className="animate-scale-in animation-delay-400 w-full max-w-xl">
          <SubmitForm />
        </div>

        {/* Supported sources */}
        <div className="animate-fade-in animation-delay-600 flex flex-col items-center gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
            Works with
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SOURCES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-white"
              >
                <Icon className="h-3.5 w-3.5 text-brand-light" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="animate-fade-in animation-delay-800 mt-6 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30"
            >
              <div
                aria-hidden
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0"
              />
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand/15 ring-1 ring-brand/20 transition-colors group-hover:bg-brand/25">
                <Icon className="h-5 w-5 text-brand-light" />
              </div>
              <h3 className="font-display text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-6 text-center text-xs text-muted-foreground">
        ChordGen — open source chord detection &amp; Guitar Pro export
      </footer>
    </main>
  );
}
