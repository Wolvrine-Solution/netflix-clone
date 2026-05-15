'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@netflix/ui'
import { useProfileStore } from '@/store/useProfileStore'
import { api } from '@/lib/api'
import type { NetflixProfile } from '@netflix/types'
import { FiEdit2 } from 'react-icons/fi'

const AVATARS = ['/avatars/1.png', '/avatars/2.png', '/avatars/3.png', '/avatars/4.png', '/avatars/5.png']

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
    <div className="min-h-screen bg-netflix-black flex flex-col items-center justify-center">
      <h1 className="text-4xl md:text-5xl font-medium mb-10">Who&apos;s watching?</h1>
      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {profiles.map((profile, i) => (
          <button
            key={profile.id}
            onClick={() => handleSelect(profile)}
            className="group flex flex-col items-center gap-3"
          >
            <div className="relative">
              <img
                src={profile.avatarUrl || AVATARS[i % AVATARS.length] || AVATARS[0]}
                alt={profile.name}
                className="w-32 h-32 rounded object-cover group-hover:ring-4 ring-white transition"
              />
              {profile.isKid && (
                <span className="absolute bottom-1 right-1 bg-netflix-red text-white text-xs px-1 rounded">KIDS</span>
              )}
            </div>
            <span className="text-netflix-light-gray text-sm group-hover:text-white transition">{profile.name}</span>
          </button>
        ))}
        {profiles.length < 5 && (
          <Link href="/profiles/manage" className="group flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded bg-netflix-medium-gray flex items-center justify-center group-hover:ring-4 ring-white transition">
              <span className="text-5xl text-netflix-light-gray group-hover:text-white">+</span>
            </div>
            <span className="text-netflix-light-gray text-sm group-hover:text-white">Add Profile</span>
          </Link>
        )}
      </div>
      <Link
        href="/profiles/manage"
        className="border border-netflix-light-gray text-netflix-light-gray hover:text-white hover:border-white px-8 py-2 text-sm tracking-widest uppercase transition flex items-center gap-2"
      >
        <FiEdit2 /> Manage Profiles
      </Link>
    </div>
  )
}
