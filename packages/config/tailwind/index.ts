import type { Config } from 'tailwindcss'

export const netflixTailwindConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        netflix: {
          red: '#E50914',
          'red-dark': '#B20710',
          'red-hover': '#F40612',
          // Deeper, richer near-blacks for a more cinematic feel
          black: '#0A0A0B',
          'true-black': '#000000',
          'dark-gray': '#141414',
          card: '#1A1A1C',
          'medium-gray': '#2A2A2D',
          border: 'rgba(255,255,255,0.08)',
          'light-gray': '#9A9A9E',
          muted: '#6B6B70',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        netflix: ['"Netflix Sans"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      backgroundImage: {
        'gradient-to-bottom': 'linear-gradient(to bottom, transparent 0%, #0A0A0B 100%)',
        'gradient-hero':
          'linear-gradient(to right, rgba(10,10,11,0.95) 0%, rgba(10,10,11,0.6) 45%, transparent 100%)',
        'gradient-brand': 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
        shimmer:
          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(0,0,0,0.7)',
        'card-hover': '0 20px 50px -12px rgba(0,0,0,0.85)',
        glow: '0 0 24px rgba(229,9,20,0.45)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
    },
  },
}
