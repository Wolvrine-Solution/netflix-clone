import type { Metadata } from 'next'
import { Sidebar } from '@/components/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Netflix Admin',
  description: 'Netflix Clone Admin Dashboard',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </body>
    </html>
  )
}
