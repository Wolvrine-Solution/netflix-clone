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
        'fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 transition-all duration-500 md:px-16',
        isScrolled
          ? 'glass-strong py-3 shadow-lg shadow-black/40'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
      )}
    >
      {/* Logo + Links */}
      <div className="flex items-center gap-10">
        <Link
          href="/browse"
          className="text-netflix-red tracking-tightest shrink-0 text-2xl font-black drop-shadow-[0_2px_10px_rgba(229,9,20,0.45)] transition-transform hover:scale-105 md:text-3xl"
        >
          NETFLIX
        </Link>
        <div className="hidden items-center gap-7 text-sm md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative transition-colors duration-200',
                  active ? 'font-semibold text-white' : 'text-white/70 hover:text-white'
                )}
              >
                {link.label}
                {active && (
                  <span className="bg-netflix-red absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full" />
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
          className="relative hidden h-9 w-9 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white sm:grid"
        >
          <FiBell className="text-lg" />
          <span className="bg-netflix-red absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="tap-highlight-none group flex items-center gap-1.5"
          >
            <div className="bg-gradient-brand shadow-glow/30 grid h-8 w-8 place-items-center rounded-lg ring-1 ring-white/10 transition-transform group-hover:scale-105">
              <FiUser className="text-sm" />
            </div>
            <FiChevronDown
              className={cn('text-sm text-white/70 transition-transform', showMenu && 'rotate-180')}
            />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
              <div className="glass-strong animate-slide-up absolute right-0 top-12 z-10 w-56 overflow-hidden rounded-xl py-2 text-sm shadow-2xl">
                {activeProfile && (
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="text-netflix-light-gray text-xs">Watching as</p>
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
                    className="w-full px-4 py-2.5 text-left text-white/85 transition hover:bg-white/10"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setActiveProfile(null)
                    signOut({ callbackUrl: '/' })
                  }}
                  className="text-netflix-light-gray mt-1 w-full border-t border-white/10 px-4 py-2.5 text-left transition hover:bg-white/10"
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
