'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useProfileStore } from '@/store/useProfileStore'
import { SearchInput } from '@/components/search/SearchInput'
import { FiBell, FiUser, FiChevronDown } from 'react-icons/fi'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/browse', label: 'Home' },
  { href: '/browse/tv', label: 'TV Shows' },
  { href: '/browse/movies', label: 'Movies' },
  { href: '/my-list', label: 'My List' },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { activeProfile, setActiveProfile } = useProfileStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-16 transition-all duration-500',
        isScrolled
          ? 'glass-strong py-3 shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      )}
    >
      {/* Logo + Links */}
      <div className="flex items-center gap-10">
        <Link
          href="/browse"
          className="text-netflix-red text-2xl md:text-3xl font-black tracking-tightest shrink-0 drop-shadow-[0_2px_10px_rgba(229,9,20,0.45)] transition-transform hover:scale-105"
        >
          NETFLIX
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative transition-colors duration-200',
                  active ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-netflix-red" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 md:gap-5">
        <SearchInput />
        <button
          aria-label="Notifications"
          className="relative hidden sm:grid place-items-center w-9 h-9 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
        >
          <FiBell className="text-lg" />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-netflix-red" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1.5 group tap-highlight-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-brand grid place-items-center ring-1 ring-white/10 shadow-glow/30 transition-transform group-hover:scale-105">
              <FiUser className="text-sm" />
            </div>
            <FiChevronDown
              className={cn('text-sm text-white/70 transition-transform', showMenu && 'rotate-180')}
            />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-12 z-10 glass-strong rounded-xl shadow-2xl w-56 py-2 text-sm animate-slide-up overflow-hidden">
                {activeProfile && (
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-netflix-light-gray">Watching as</p>
                    <p className="font-semibold">{activeProfile.name}</p>
                  </div>
                )}
                {[
                  { label: 'Switch Profile', to: '/profiles' },
                  { label: 'Manage Profiles', to: '/profiles/manage' },
                  { label: 'Account Settings', to: '/settings' },
                  { label: 'Subscription', to: '/subscription' },
                ].map((item) => (
                  <button
                    key={item.to}
                    onClick={() => {
                      setShowMenu(false)
                      router.push(item.to)
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition text-white/85"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setActiveProfile(null)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition text-netflix-light-gray border-t border-white/10 mt-1"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
