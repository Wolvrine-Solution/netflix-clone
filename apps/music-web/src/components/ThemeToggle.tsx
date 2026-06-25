"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="glass w-10 h-10 rounded-lg flex items-center justify-center hover:bg-brand/10 hover:border-brand/30 transition-all duration-200 border border-brand/10 shadow-md shadow-brand/5"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <Sun className="w-4 h-4 text-brand-light transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-light transition-transform duration-300 hover:rotate-45" />
      )}
    </button>
  );
}
