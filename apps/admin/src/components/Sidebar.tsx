import Link from 'next/link'
import { FiHome, FiFilm, FiList, FiUsers, FiBarChart2 } from 'react-icons/fi'

const links = [
  { href: '/', label: 'Dashboard', icon: FiHome },
  { href: '/content', label: 'Content', icon: FiFilm },
  { href: '/rows', label: 'Browse Rows', icon: FiList },
  { href: '/users', label: 'Users', icon: FiUsers },
  { href: '/analytics', label: 'Analytics', icon: FiBarChart2 },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <span className="text-netflix-red text-xl font-black tracking-tight">NETFLIX</span>
        <span className="text-gray-400 text-sm ml-2">Admin</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <Icon className="text-lg" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <Link href="http://localhost:3000" target="_blank" className="text-xs text-gray-500 hover:text-gray-300">
          → View Site
        </Link>
      </div>
    </aside>
  )
}
