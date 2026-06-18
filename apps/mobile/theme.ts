/**
 * Design tokens for the Netflix Clone mobile app.
 * Mirrors the web app's dark theme: deep near-black surfaces with a
 * Netflix-red accent, glassmorphism, generous spacing and a bold type scale.
 */

export const colors = {
  // Backgrounds
  background: '#0A0A0B',
  backgroundElevated: '#141414',
  surface: '#1A1A1D',
  surfaceElevated: '#222226',

  // Glassmorphism overlays (use with BlurView / rgba fills)
  glass: 'rgba(20, 20, 20, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  scrim: 'rgba(0, 0, 0, 0.6)',

  // Brand
  red: '#E50914',
  redDark: '#B20710',
  redSoft: 'rgba(229, 9, 20, 0.16)',

  // Text
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textMuted: 'rgba(255, 255, 255, 0.48)',
  textFaint: 'rgba(255, 255, 255, 0.28)',

  // Lines / dividers
  border: 'rgba(255, 255, 255, 0.10)',

  // Utility
  black: '#000000',
  white: '#FFFFFF',
  success: '#2ECC71',
  rankOutline: 'rgba(255, 255, 255, 0.22)',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  pill: 999,
} as const

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' as const, letterSpacing: -0.5 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.3 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const, letterSpacing: -0.2 },
  subheading: { fontSize: 17, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 0.6 },
} as const

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  glow: {
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
  },
} as const

export const theme = { colors, spacing, radii, typography, shadows }
export default theme
