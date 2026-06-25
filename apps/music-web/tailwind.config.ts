import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#8B5CF6",
          dark: "#6D28D9",
          light: "#A78BFA",
          glow: "#A855F7",
        },
        accent: {
          DEFAULT: "#22D3EE",
          pink: "#F472B6",
          amber: "#FBBF24",
        },
        surface: {
          DEFAULT: "#08080C",
          card: "#111119",
          elevated: "#191922",
          border: "#26263340",
          hairline: "#FFFFFF0D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(139,92,246,0.2), 0 8px 40px -8px rgba(139,92,246,0.5)",
        "glow-lg": "0 0 0 1px rgba(139,92,246,0.25), 0 20px 70px -12px rgba(139,92,246,0.6)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 50px -20px rgba(0,0,0,0.8)",
        "inner-top": "0 1px 0 0 rgba(255,255,255,0.06) inset",
      },
      backgroundImage: {
        "mesh-aurora":
          "radial-gradient(at 20% 0%, rgba(139,92,246,0.25) 0px, transparent 50%), radial-gradient(at 80% 10%, rgba(34,211,238,0.12) 0px, transparent 45%), radial-gradient(at 50% 90%, rgba(244,114,182,0.10) 0px, transparent 50%)",
        "brand-gradient": "linear-gradient(135deg, #A855F7 0%, #8B5CF6 50%, #6366F1 100%)",
        "shimmer":
          "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "gradient-pan": "gradientPan 8s ease infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-24px) translateX(12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientPan: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
