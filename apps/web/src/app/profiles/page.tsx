'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Spinner } from '@netflix/ui'
import { useProfileStore } from '@/store/useProfileStore'
import { api } from '@/lib/api'
import type { NetflixProfile } from '@netflix/types'
import { FiEdit2, FiPlus } from 'react-icons/fi'

const AVATARS = ['/avatars/1.png', '/avatars/2.png', '/avatars/3.png', '/avatars/4.png', '/avatars/5.png']
const AVATAR_COLORS = ['#E50914', '#2563EB', '#16A34A', '#D97706', '#7C3AED']

export default function ProfilesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setActiveProfile } = useProfileStore()
  const [profiles, setProfiles] = useState<NetflixProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      api.profiles.list().then((res) => {
        setProfiles(res.data.data as NetflixProfile[])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [status])

  const handleSelect = (profile: NetflixProfile) => {
    setActiveProfile(profile)
    router.push('/browse')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-netflix-black flex flex-col items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-netflix-red/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Who&apos;s watching?</h1>
        <p className="text-netflix-light-gray text-sm mb-12">Select your profile to continue</p>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 max-w-2xl">
          {profiles.map((profile, i) => (
            <motion.button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="group flex flex-col items-center gap-3"
            >
              <div className="relative">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-white transition-all duration-200 shadow-card"
                  />
                ) : (
                  <div
                    className="w-28 h-28 md:w-32 md:h-32 rounded-2xl grid place-items-center text-4xl font-black ring-2 ring-transparent group-hover:ring-white transition-all duration-200 shadow-card"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {profile.isKid && (
                  <span className="absolute -bottom-1 -right-1 bg-netflix-red text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md">
                    KIDS
                  </span>
                )}
              </div>
              <span className="text-netflix-light-gray text-sm font-medium group-hover:text-white transition-colors">
                {profile.name}
              </span>
            </motion.button>
          ))}

          {profiles.length < 5 && (
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Link href="/profiles/manage" className="group flex flex-col items-center gap-3">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl glass flex items-center justify-center ring-2 ring-transparent group-hover:ring-white transition-all duration-200 shadow-card">
                  <FiPlus className="text-4xl text-netflix-muted group-hover:text-white transition-colors" />
                </div>
                <span className="text-netflix-muted text-sm font-medium group-hover:text-white transition-colors">
                  Add Profile
                </span>
              </Link>
            </motion.div>
          )}
        </div>

        <Link
          href="/profiles/manage"
          className="flex items-center gap-2 border border-white/30 text-netflix-light-gray hover:text-white hover:border-white px-8 py-2.5 text-sm tracking-widest uppercase font-semibold transition rounded-lg"
        >
          <FiEdit2 className="text-base" /> Manage Profiles
        </Link>
      </motion.div>
    </div>
  )
}
