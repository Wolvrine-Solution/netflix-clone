import type { Metadata } from 'next'
import { Providers } from './providers'
import { Sidebar } from '@/components/Sidebar'
import { auth } from '@/lib/auth'
import './globals.css'

export const metadata: Metadata = {
  title: 'Netflix Admin',
  description: 'Netflix Clone — Admin Dashboard',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isLoginPage = false // middleware handles redirect

  return (
    <html lang="en">
      <body className="bg-gray-950 text-white">
        <Providers>
          {session ? (
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
                <div className="p-8">{children}</div>
              </main>
            </div>
          ) : (
            <>{children}</>
          )}
        </Providers>
      </body>
    </html>
  )
}
