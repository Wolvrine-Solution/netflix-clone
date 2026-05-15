import type { Config } from 'tailwindcss'

export const netflixTailwindConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        netflix: {
          red: '#E50914',
          'red-dark': '#B20710',
          'red-hover': '#F40612',
          black: '#141414',
          'dark-gray': '#181818',
          'medium-gray': '#2F2F2F',
          'light-gray': '#808080',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        netflix: ['"Netflix Sans"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-to-bottom': 'linear-gradient(to bottom, transparent 0%, #141414 100%)',
        'gradient-hero':
          'linear-gradient(to right, rgba(20,20,20,0.9) 0%, rgba(20,20,20,0.6) 50%, transparent 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
    },
  },
}
