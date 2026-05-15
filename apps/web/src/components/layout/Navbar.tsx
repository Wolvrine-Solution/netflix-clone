'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useProfileStore } from '@/store/useProfileStore'
import { SearchInput } from '@/components/search/SearchInput'
import { FiBell, FiUser, FiChevronDown } from 'react-icons/fi'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const { activeProfile, setActiveProfile } = useProfileStore()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:px-16 py-4 transition-all duration-500',
        isScrolled ? 'bg-netflix-black' : 'bg-gradient-to-b from-black/80 to-transparent'
      )}
    >
      {/* Logo + Links */}
      <div className="flex items-center gap-8">
        <Link href="/browse" className="text-netflix-red text-2xl font-black tracking-tight shrink-0">
          NETFLIX
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/browse" className="hover:text-netflix-light-gray transition">Home</Link>
          <Link href="/browse/tv" className="hover:text-netflix-light-gray transition">TV Shows</Link>
          <Link href="/browse/movies" className="hover:text-netflix-light-gray transition">Movies</Link>
          <Link href="/my-list" className="hover:text-netflix-light-gray transition">My List</Link>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        <SearchInput />
        <FiBell className="text-xl cursor-pointer hover:text-netflix-light-gray transition" />
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-netflix-red rounded flex items-center justify-center">
              <FiUser className="text-sm" />
            </div>
            <FiChevronDown className={cn('text-sm transition-transform', showMenu && 'rotate-180')} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-netflix-dark-gray border border-netflix-medium-gray rounded shadow-xl w-48 py-2 text-sm">
              {activeProfile && (
                <div className="px-4 py-2 border-b border-netflix-medium-gray">
                  <p className="text-xs text-netflix-light-gray">Watching as</p>
                  <p className="font-medium">{activeProfile.name}</p>
                </div>
              )}
              <button
                onClick={() => { setShowMenu(false); router.push('/profiles') }}
                className="w-full text-left px-4 py-2 hover:bg-netflix-medium-gray transition"
              >
                Switch Profile
              </button>
              <button
                onClick={() => { setShowMenu(false); router.push('/profiles/manage') }}
                className="w-full text-left px-4 py-2 hover:bg-netflix-medium-gray transition"
              >
                Manage Profiles
              </button>
              <button
                onClick={() => { setActiveProfile(null); signOut({ callbackUrl: '/' }) }}
                className="w-full text-left px-4 py-2 hover:bg-netflix-medium-gray transition text-netflix-light-gray border-t border-netflix-medium-gray mt-2"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
