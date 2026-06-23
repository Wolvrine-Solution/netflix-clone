/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
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
        netflix: ['Inter_400Regular'],
        'netflix-bold': ['Inter_700Bold'],
        'netflix-black': ['Inter_900Black'],
      },
    },
  },
  plugins: [],
}
