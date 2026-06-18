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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-white/10 safe-bottom">
      <div className="flex items-stretch justify-around px-2 pt-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === '/browse' && pathname === '/browse')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 flex-1 py-1 tap-highlight-none"
            >
              <span
                className={cn(
                  'grid place-items-center w-11 h-7 rounded-full transition-all duration-200',
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
