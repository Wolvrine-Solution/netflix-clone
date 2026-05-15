import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Netflix Clone', template: '%s | Netflix Clone' },
  description: 'Watch TV shows and movies online.',
  icons: { icon: '/netflix-logo-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
