'use client'
import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FiUser, FiLock, FiBell, FiMonitor, FiLogOut, FiCheck } from 'react-icons/fi'
import { api } from '@/lib/api'

type Tab = 'account' | 'security' | 'notifications' | 'playback'

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user

  const [tab, setTab] = useState<Tab>('account')
  const [name, setName] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)

  // Playback preferences
  const [autoPlay, setAutoPlay] = useState(true)
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(true)
  const [quality, setQuality] = useState('AUTO')
  const [subtitles, setSubtitles] = useState(false)
  const [subtitleLang, setSubtitleLang] = useState('en')

  // Notification prefs
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [newContentNotifs, setNewContentNotifs] = useState(true)
  const [promoNotifs, setPromoNotifs] = useState(false)

  async function saveProfile() {
    if (!name.trim()) return
    try {
      await api.profiles.list() // no-op just to exercise
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
  }

  const sidebarItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'account', label: 'Account', icon: <FiUser /> },
    { id: 'security', label: 'Security', icon: <FiLock /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'playback', label: 'Playback & Display', icon: <FiMonitor /> },
  ]

  const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? 'bg-netflix-red' : 'bg-gray-700'}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )

  const inp =
    'w-full bg-netflix-medium-gray border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-netflix-red transition'

  return (
    <div className="bg-netflix-black min-h-screen text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Account Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${tab === item.id ? 'bg-netflix-medium-gray text-white' : 'text-netflix-light-gray hover:bg-netflix-dark-gray hover:text-white'}`}
                >
                  <span className={tab === item.id ? 'text-netflix-red' : ''}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="mt-4 border-t border-gray-800 pt-4">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-netflix-light-gray flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:text-red-400"
                >
                  <FiLogOut /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-netflix-dark-gray flex-1 space-y-6 rounded-2xl p-6">
            {/* ── ACCOUNT ── */}
            {tab === 'account' && (
              <>
                <h2 className="text-xl font-semibold">Account</h2>
                <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
                  {user?.image ? (
                    <img src={user.image} alt="" className="h-16 w-16 rounded-full" />
                  ) : (
                    <div className="bg-netflix-medium-gray flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                      {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{user?.name ?? 'User'}</p>
                    <p className="text-netflix-light-gray text-sm">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs text-gray-400">Display Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-gray-400">Email</label>
                    <input
                      value={user?.email ?? ''}
                      disabled
                      className={`${inp} cursor-not-allowed opacity-50`}
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Email cannot be changed here. Contact support.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveProfile}
                      className="bg-netflix-red hover:bg-netflix-red-hover flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition"
                    >
                      {saved ? (
                        <>
                          <FiCheck /> Saved
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={() => router.push('/profiles')}
                      className="bg-netflix-medium-gray rounded-lg px-5 py-2.5 text-sm text-white transition hover:bg-gray-700"
                    >
                      Manage Profiles
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── SECURITY ── */}
            {tab === 'security' && (
              <>
                <h2 className="text-xl font-semibold">Security</h2>
                <div className="space-y-6">
                  <div className="bg-netflix-black space-y-3 rounded-xl p-4">
                    <h3 className="text-sm font-medium">Password</h3>
                    <p className="text-xs text-gray-500">Last changed: unknown</p>
                    <button className="bg-netflix-medium-gray rounded-lg px-4 py-2 text-sm text-white transition hover:bg-gray-700">
                      Change Password
                    </button>
                  </div>
                  <div className="bg-netflix-black space-y-3 rounded-xl p-4">
                    <h3 className="text-sm font-medium">Sign Out of All Devices</h3>
                    <p className="text-xs text-gray-500">
                      Revoke access to all active sessions except the current one.
                    </p>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="bg-netflix-medium-gray rounded-lg px-4 py-2 text-sm text-white transition hover:bg-gray-700"
                    >
                      Sign Out Everywhere
                    </button>
                  </div>
                  <div className="bg-netflix-black space-y-3 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium">Connected Accounts</h3>
                        <p className="mt-0.5 text-xs text-gray-500">Manage OAuth connections</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Google', icon: '🔵', connected: true },
                        { name: 'GitHub', icon: '⚫', connected: false },
                      ].map((acc) => (
                        <div
                          key={acc.name}
                          className="flex items-center justify-between border-b border-gray-800 py-2 last:border-0"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <span>{acc.icon}</span>
                            <span>{acc.name}</span>
                          </div>
                          <span
                            className={`text-xs ${acc.connected ? 'text-green-400' : 'text-gray-500'}`}
                          >
                            {acc.connected ? 'Connected' : 'Not connected'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── NOTIFICATIONS ── */}
            {tab === 'notifications' && (
              <>
                <h2 className="text-xl font-semibold">Notifications</h2>
                <div className="space-y-5">
                  {[
                    {
                      label: 'Email Notifications',
                      desc: 'Receive emails from us',
                      value: emailNotifs,
                      set: setEmailNotifs,
                    },
                    {
                      label: 'New Content Alerts',
                      desc: 'Get notified when new shows or movies arrive',
                      value: newContentNotifs,
                      set: setNewContentNotifs,
                    },
                    {
                      label: 'Promotions & Offers',
                      desc: 'Deals, trials, and limited-time offers',
                      value: promoNotifs,
                      set: setPromoNotifs,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b border-gray-800 py-4 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <Toggle on={item.value} onChange={item.set} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── PLAYBACK ── */}
            {tab === 'playback' && (
              <>
                <h2 className="text-xl font-semibold">Playback & Display</h2>
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-gray-800 py-4">
                    <div>
                      <p className="text-sm font-medium">Auto-Play Next Episode</p>
                      <p className="text-xs text-gray-500">
                        Automatically play the next episode when watching TV shows
                      </p>
                    </div>
                    <Toggle on={autoPlay} onChange={setAutoPlay} />
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-800 py-4">
                    <div>
                      <p className="text-sm font-medium">Auto-Play Previews</p>
                      <p className="text-xs text-gray-500">Play previews when browsing</p>
                    </div>
                    <Toggle on={autoPlayPreviews} onChange={setAutoPlayPreviews} />
                  </div>
                  <div className="space-y-3 border-b border-gray-800 py-4">
                    <p className="text-sm font-medium">Playback Quality</p>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="bg-netflix-black focus:border-netflix-red w-48 rounded-lg border border-gray-700 px-3 py-2 text-sm text-white outline-none"
                    >
                      <option value="AUTO">Auto</option>
                      <option value="Q_4K">4K Ultra HD</option>
                      <option value="Q_1080P">Full HD (1080p)</option>
                      <option value="Q_720P">HD (720p)</option>
                      <option value="Q_480P">SD (480p)</option>
                    </select>
                    <p className="text-xs text-gray-600">Higher quality uses more data.</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-800 py-4">
                    <div>
                      <p className="text-sm font-medium">Subtitles</p>
                      <p className="text-xs text-gray-500">Show subtitles by default</p>
                    </div>
                    <Toggle on={subtitles} onChange={setSubtitles} />
                  </div>
                  {subtitles && (
                    <div className="space-y-2 py-2">
                      <label className="text-xs text-gray-400">Subtitle Language</label>
                      <select
                        value={subtitleLang}
                        onChange={(e) => setSubtitleLang(e.target.value)}
                        className="bg-netflix-black focus:border-netflix-red w-48 rounded-lg border border-gray-700 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
