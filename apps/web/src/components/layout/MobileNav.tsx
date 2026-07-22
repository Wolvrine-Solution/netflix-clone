'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiSearch, FiTrendingUp, FiBookmark, FiUser } from 'react-icons/fi'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/browse', label: 'Home', Icon: FiHome },
  { href: '/search', label: 'Search', Icon: FiSearch },
  { href: '/browse/tv', label: 'New & Hot', Icon: FiTrendingUp },
  { href: '/my-list', label: 'My List', Icon: FiBookmark },
  { href: '/settings', label: 'Profile', Icon: FiUser },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="glass-strong safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 md:hidden">
      <div className="flex items-stretch justify-around px-2 pt-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === '/browse' && pathname === '/browse')
          return (
            <Link
              key={href}
              href={href}
              className="tap-highlight-none flex flex-1 flex-col items-center gap-1 py-1"
            >
              <span
                className={cn(
                  'grid h-7 w-11 place-items-center rounded-full transition-all duration-200',
                  active ? 'bg-netflix-red/15 text-netflix-red' : 'text-white/55'
                )}
              >
                <Icon className="text-[1.35rem]" />
              </span>
              <span
                className={cn(
                  'text-[0.62rem] font-medium transition-colors',
                  active ? 'text-white' : 'text-white/55'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
