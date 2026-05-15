'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Spinner } from '@netflix/ui'
import { api } from '@/lib/api'
import type { NetflixProfile } from '@netflix/types'
import { FiTrash2 } from 'react-icons/fi'

const AVATARS = ['/avatars/1.png', '/avatars/2.png', '/avatars/3.png', '/avatars/4.png', '/avatars/5.png']

export default function ManageProfilesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [profiles, setProfiles] = useState<NetflixProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [isKid, setIsKid] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      loadProfiles()
    }
  }, [status])

  const loadProfiles = async () => {
    const res = await api.profiles.list()
    setProfiles(res.data.data as NetflixProfile[])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    await api.profiles.create({ name: newName, avatarUrl: AVATARS[selectedAvatar] ?? '', isKid })
    setNewName('')
    setSelectedAvatar(0)
    setIsKid(false)
    setCreating(false)
    loadProfiles()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return
    await api.profiles.delete(id)
    loadProfiles()
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-netflix-black flex items-center justify-center"><Spinner size="lg" /></div>
  }

  return (
    <div className="min-h-screen bg-netflix-black py-16 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Manage Profiles</h1>
          <Link href="/profiles" className="text-netflix-light-gray hover:text-white text-sm">← Back</Link>
        </div>

        <div className="space-y-4 mb-10">
          {profiles.map((profile, i) => (
            <div key={profile.id} className="flex items-center gap-4 bg-netflix-dark-gray p-4 rounded-lg">
              <img src={profile.avatarUrl || AVATARS[i % AVATARS.length] || ''} alt={profile.name} className="w-16 h-16 rounded" />
              <div className="flex-1">
                <p className="font-semibold">{profile.name}</p>
                {profile.isKid && <span className="text-xs text-netflix-red">KIDS</span>}
              </div>
              <button
                onClick={() => handleDelete(profile.id)}
                className="text-netflix-light-gray hover:text-red-500 transition p-2"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>

        {profiles.length < 5 && (
          <div className="bg-netflix-dark-gray rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Profile</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-netflix-light-gray mb-2">Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Profile name"
                  className="w-full bg-netflix-medium-gray rounded px-4 py-3 text-white outline-none focus:ring-1 focus:ring-netflix-red"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-netflix-light-gray mb-2">Choose Avatar</label>
                <div className="flex gap-3">
                  {AVATARS.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(i)}
                      className={`rounded overflow-hidden ${selectedAvatar === i ? 'ring-2 ring-netflix-red' : ''}`}
                    >
                      <img src={src} alt={`Avatar ${i + 1}`} className="w-14 h-14 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKid}
                  onChange={(e) => setIsKid(e.target.checked)}
                  className="accent-netflix-red w-4 h-4"
                />
                <span className="text-sm">Kid profile (restricts content)</span>
              </label>
              <Button type="submit" variant="primary" loading={creating}>
                Add Profile
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
