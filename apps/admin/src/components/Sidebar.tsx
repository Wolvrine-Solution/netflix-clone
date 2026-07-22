'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  FiHome,
  FiFilm,
  FiList,
  FiUsers,
  FiBarChart2,
  FiTag,
  FiBell,
  FiSettings,
  FiLogOut,
  FiVideo,
} from 'react-icons/fi'

const nav = [
  {
    section: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: FiHome },
      { href: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    ],
  },
  {
    section: 'Content',
    items: [
      { href: '/content', label: 'All Content', icon: FiFilm },
      { href: '/content/new', label: 'Add Content', icon: FiVideo },
      { href: '/genres', label: 'Genres', icon: FiTag },
      { href: '/rows', label: 'Browse Rows', icon: FiList },
    ],
  },
  {
    section: 'Users',
    items: [
      { href: '/users', label: 'Users', icon: FiUsers },
      { href: '/notifications', label: 'Notifications', icon: FiBell },
    ],
  },
  { section: 'System', items: [{ href: '/settings', label: 'Settings', icon: FiSettings }] },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-64 flex-col border-r border-gray-800 bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-800 p-6">
        <span className="text-netflix-red text-xl font-black tracking-tight">NETFLIX</span>
        <span className="rounded bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-400">
          ADMIN
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        {nav.map(({ section, items }) => (
          <div key={section} className="mb-4">
            <p className="mb-1 px-5 text-xs font-semibold uppercase tracking-wider text-gray-600">
              {section}
            </p>
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-netflix-red/10 text-netflix-red'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="flex-shrink-0 text-base" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-1 border-t border-gray-800 p-4">
        <Link
          href={process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'}
          target="_blank"
          className="mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:text-gray-300"
        >
          <FiHome className="text-base" />
          View Site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mx-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:text-red-400"
        >
          <FiLogOut className="text-base" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
