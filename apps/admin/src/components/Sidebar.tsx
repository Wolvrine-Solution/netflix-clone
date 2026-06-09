'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  FiHome, FiFilm, FiList, FiUsers, FiBarChart2,
  FiTag, FiBell, FiSettings, FiLogOut, FiVideo,
} from 'react-icons/fi'

const nav = [
  { section: 'Overview', items: [
    { href: '/', label: 'Dashboard', icon: FiHome },
    { href: '/analytics', label: 'Analytics', icon: FiBarChart2 },
  ]},
  { section: 'Content', items: [
    { href: '/content', label: 'All Content', icon: FiFilm },
    { href: '/content/new', label: 'Add Content', icon: FiVideo },
    { href: '/genres', label: 'Genres', icon: FiTag },
    { href: '/rows', label: 'Browse Rows', icon: FiList },
  ]},
  { section: 'Users', items: [
    { href: '/users', label: 'Users', icon: FiUsers },
    { href: '/notifications', label: 'Notifications', icon: FiBell },
  ]},
  { section: 'System', items: [
    { href: '/settings', label: 'Settings', icon: FiSettings },
  ]},
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800 flex items-center gap-2">
        <span className="text-netflix-red text-xl font-black tracking-tight">NETFLIX</span>
        <span className="bg-red-900/40 text-red-400 text-xs font-semibold px-2 py-0.5 rounded">ADMIN</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {nav.map(({ section, items }) => (
          <div key={section} className="mb-4">
            <p className="px-5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">{section}</p>
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-netflix-red/10 text-netflix-red'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="text-base flex-shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-1">
        <Link
          href={process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'}
          target="_blank"
          className="flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 transition"
        >
          <FiHome className="text-base" />
          View Site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 transition"
        >
          <FiLogOut className="text-base" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
