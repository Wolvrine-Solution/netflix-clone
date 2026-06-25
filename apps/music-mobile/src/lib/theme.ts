export const colors = {
  bg: "#08080C",
  card: "#111119",
  elevated: "#191922",
  border: "#262633",
  hairline: "rgba(255,255,255,0.06)",
  brand: "#8B5CF6",
  brandDark: "#6D28D9",
  brandLight: "#A78BFA",
  brandGlow: "#A855F7",
  accent: "#22D3EE",
  accentPink: "#F472B6",
  accentAmber: "#FBBF24",
  white: "#FFFFFF",
  muted: "#8585A0",
  mutedDark: "#5B5B72",
  red: "#FB7185",
  green: "#34D399",
  blue: "#38BDF8",
};

// Gradient stops for LinearGradient components
export const gradients = {
  brand: ["#A855F7", "#8B5CF6", "#6366F1"] as const,
  brandSoft: ["rgba(139,92,246,0.25)", "rgba(99,102,241,0.05)"] as const,
  aurora: ["rgba(139,92,246,0.18)", "rgba(34,211,238,0.06)", "#08080C"] as const,
  card: ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.01)"] as const,
};

export const fonts = {
  regular: "Inter-Regular",
  bold: "Inter-Bold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 26,
  full: 999,
};

// Reusable elevation shadow (purple glow for primary surfaces)
export const shadow = {
  glow: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
  },
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
};
