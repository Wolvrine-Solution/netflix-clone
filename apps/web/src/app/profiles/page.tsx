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

const AVATARS = [
  '/avatars/1.png',
  '/avatars/2.png',
  '/avatars/3.png',
  '/avatars/4.png',
  '/avatars/5.png',
]
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
      api.profiles
        .list()
        .then((res) => {
          setProfiles(res.data.data as NetflixProfile[])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status])

  const handleSelect = (profile: NetflixProfile) => {
    setActiveProfile(profile)
    router.push('/browse')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="bg-netflix-black flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="bg-netflix-black flex min-h-screen flex-col items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-netflix-red/5 absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <h1 className="mb-3 text-4xl font-black tracking-tight md:text-5xl">
          Who&apos;s watching?
        </h1>
        <p className="text-netflix-light-gray mb-12 text-sm">Select your profile to continue</p>

        <div className="mb-12 flex max-w-2xl flex-wrap justify-center gap-4 md:gap-6">
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
                    className="shadow-card h-28 w-28 rounded-2xl object-cover ring-2 ring-transparent transition-all duration-200 group-hover:ring-white md:h-32 md:w-32"
                  />
                ) : (
                  <div
                    className="shadow-card grid h-28 w-28 place-items-center rounded-2xl text-4xl font-black ring-2 ring-transparent transition-all duration-200 group-hover:ring-white md:h-32 md:w-32"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {profile.isKid && (
                  <span className="bg-netflix-red absolute -bottom-1 -right-1 rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                    KIDS
                  </span>
                )}
              </div>
              <span className="text-netflix-light-gray text-sm font-medium transition-colors group-hover:text-white">
                {profile.name}
              </span>
            </motion.button>
          ))}

          {profiles.length < 5 && (
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
              <Link href="/profiles/manage" className="group flex flex-col items-center gap-3">
                <div className="glass shadow-card flex h-28 w-28 items-center justify-center rounded-2xl ring-2 ring-transparent transition-all duration-200 group-hover:ring-white md:h-32 md:w-32">
                  <FiPlus className="text-netflix-muted text-4xl transition-colors group-hover:text-white" />
                </div>
                <span className="text-netflix-muted text-sm font-medium transition-colors group-hover:text-white">
                  Add Profile
                </span>
              </Link>
            </motion.div>
          )}
        </div>

        <Link
          href="/profiles/manage"
          className="text-netflix-light-gray flex items-center gap-2 rounded-lg border border-white/30 px-8 py-2.5 text-sm font-semibold uppercase tracking-widest transition hover:border-white hover:text-white"
        >
          <FiEdit2 className="text-base" /> Manage Profiles
        </Link>
      </motion.div>
    </div>
  )
}
