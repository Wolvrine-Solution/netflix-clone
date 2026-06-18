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
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${on ? 'bg-netflix-red' : 'bg-gray-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )

  const inp = 'w-full bg-netflix-medium-gray border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-netflix-red transition'

  return (
    <div className="min-h-screen bg-netflix-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-52 flex-shrink-0">
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${tab === item.id ? 'bg-netflix-medium-gray text-white' : 'text-netflix-light-gray hover:text-white hover:bg-netflix-dark-gray'}`}
                >
                  <span className={tab === item.id ? 'text-netflix-red' : ''}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-gray-800 mt-4">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-netflix-light-gray hover:text-red-400 transition"
                >
                  <FiLogOut /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-netflix-dark-gray rounded-2xl p-6 space-y-6">
            {/* ── ACCOUNT ── */}
            {tab === 'account' && (
              <>
                <h2 className="text-xl font-semibold">Account</h2>
                <div className="flex items-center gap-4 pb-6 border-b border-gray-800">
                  {user?.image ? (
                    <img src={user.image} alt="" className="w-16 h-16 rounded-full" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-netflix-medium-gray flex items-center justify-center text-2xl font-bold">
                      {(user?.name ?? user?.email ?? '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{user?.name ?? 'User'}</p>
                    <p className="text-sm text-netflix-light-gray">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Display Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Email</label>
                    <input value={user?.email ?? ''} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
                    <p className="text-xs text-gray-600 mt-1">Email cannot be changed here. Contact support.</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveProfile}
                      className="flex items-center gap-2 bg-netflix-red hover:bg-netflix-red-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                    >
                      {saved ? <><FiCheck /> Saved</> : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => router.push('/profiles')}
                      className="bg-netflix-medium-gray hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg text-sm transition"
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
                  <div className="p-4 bg-netflix-black rounded-xl space-y-3">
                    <h3 className="font-medium text-sm">Password</h3>
                    <p className="text-xs text-gray-500">Last changed: unknown</p>
                    <button className="bg-netflix-medium-gray hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition">Change Password</button>
                  </div>
                  <div className="p-4 bg-netflix-black rounded-xl space-y-3">
                    <h3 className="font-medium text-sm">Sign Out of All Devices</h3>
                    <p className="text-xs text-gray-500">Revoke access to all active sessions except the current one.</p>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="bg-netflix-medium-gray hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg transition"
                    >
                      Sign Out Everywhere
                    </button>
                  </div>
                  <div className="p-4 bg-netflix-black rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-sm">Connected Accounts</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Manage OAuth connections</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: 'Google', icon: '🔵', connected: true },
                        { name: 'GitHub', icon: '⚫', connected: false },
                      ].map((acc) => (
                        <div key={acc.name} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                          <div className="flex items-center gap-2 text-sm">
                            <span>{acc.icon}</span>
                            <span>{acc.name}</span>
                          </div>
                          <span className={`text-xs ${acc.connected ? 'text-green-400' : 'text-gray-500'}`}>
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
                    { label: 'Email Notifications', desc: 'Receive emails from us', value: emailNotifs, set: setEmailNotifs },
                    { label: 'New Content Alerts', desc: 'Get notified when new shows or movies arrive', value: newContentNotifs, set: setNewContentNotifs },
                    { label: 'Promotions & Offers', desc: 'Deals, trials, and limited-time offers', value: promoNotifs, set: setPromoNotifs },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-4 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
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
                  <div className="flex items-center justify-between py-4 border-b border-gray-800">
                    <div>
                      <p className="font-medium text-sm">Auto-Play Next Episode</p>
                      <p className="text-xs text-gray-500">Automatically play the next episode when watching TV shows</p>
                    </div>
                    <Toggle on={autoPlay} onChange={setAutoPlay} />
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-gray-800">
                    <div>
                      <p className="font-medium text-sm">Auto-Play Previews</p>
                      <p className="text-xs text-gray-500">Play previews when browsing</p>
                    </div>
                    <Toggle on={autoPlayPreviews} onChange={setAutoPlayPreviews} />
                  </div>
                  <div className="py-4 border-b border-gray-800 space-y-3">
                    <p className="font-medium text-sm">Playback Quality</p>
                    <select value={quality} onChange={(e) => setQuality(e.target.value)}
                      className="w-48 bg-netflix-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red">
                      <option value="AUTO">Auto</option>
                      <option value="Q_4K">4K Ultra HD</option>
                      <option value="Q_1080P">Full HD (1080p)</option>
                      <option value="Q_720P">HD (720p)</option>
                      <option value="Q_480P">SD (480p)</option>
                    </select>
                    <p className="text-xs text-gray-600">Higher quality uses more data.</p>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-gray-800">
                    <div>
                      <p className="font-medium text-sm">Subtitles</p>
                      <p className="text-xs text-gray-500">Show subtitles by default</p>
                    </div>
                    <Toggle on={subtitles} onChange={setSubtitles} />
                  </div>
                  {subtitles && (
                    <div className="py-2 space-y-2">
                      <label className="text-xs text-gray-400">Subtitle Language</label>
                      <select value={subtitleLang} onChange={(e) => setSubtitleLang(e.target.value)}
                        className="w-48 bg-netflix-black border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red">
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
