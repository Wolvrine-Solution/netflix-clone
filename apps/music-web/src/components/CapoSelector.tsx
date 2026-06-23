"use client";

interface Props {
  capo: number;
  onChange: (capo: number) => void;
}

export function CapoSelector({ capo, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Capo
        </label>
        <span className="text-xs font-mono text-brand-light">
          {capo === 0 ? "None" : `Fret ${capo}`}
        </span>
      </div>

      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: 8 }, (_, i) => i).map((fret) => (
          <button
            key={fret}
            onClick={() => onChange(fret)}
            className={`w-8 h-8 rounded-lg text-xs font-mono transition-all ${
              capo === fret
                ? "bg-brand text-white shadow-md shadow-brand/30"
                : "glass text-muted-foreground hover:text-white hover:bg-surface-elevated"
            }`}
          >
            {fret === 0 ? "—" : fret}
          </button>
        ))}
      </div>
    </div>
  );
}
