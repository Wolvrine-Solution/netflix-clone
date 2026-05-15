import type { Config } from 'tailwindcss'
import { netflixTailwindConfig } from '@netflix/config/tailwind'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      ...(netflixTailwindConfig.theme?.extend ?? {}),
    },
  },
  plugins: [],
}

export default config
