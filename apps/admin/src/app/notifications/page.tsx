'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { FiBell, FiUsers, FiUser, FiCheckCircle } from 'react-icons/fi'

type NotifType = 'NEW_CONTENT' | 'ACCOUNT' | 'SUBSCRIPTION' | 'PROMO' | 'SYSTEM'

const NOTIF_TYPES: { value: NotifType; label: string; desc: string }[] = [
  { value: 'NEW_CONTENT', label: 'New Content', desc: 'Notify about new movies or shows' },
  { value: 'PROMO', label: 'Promotion', desc: 'Deals, discounts, or trials' },
  { value: 'SYSTEM', label: 'System', desc: 'Maintenance or platform updates' },
  { value: 'ACCOUNT', label: 'Account', desc: 'Account-related messages' },
  { value: 'SUBSCRIPTION', label: 'Subscription', desc: 'Plan changes or billing notices' },
]

export default function NotificationsPage() {
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken ?? ''
  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

  const [mode, setMode] = useState<'all' | 'specific'>('all')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NotifType>('SYSTEM')
  const [userIds, setUserIds] = useState('')
  const [link, setLink] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function send() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    try {
      const payload: Record<string, unknown> = { title, body, type, link: link || undefined }
      if (mode === 'specific') {
        payload.userIds = userIds.split(',').map((s) => s.trim()).filter(Boolean)
      }
      await fetch(`${API}/api/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      setSent(true)
      setTitle(''); setBody(''); setLink(''); setUserIds('')
      setTimeout(() => setSent(false), 5000)
    } finally { setSending(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-gray-400 mt-1">Broadcast messages to your users</p>
      </div>

      {sent && (
        <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/50 rounded-xl p-4 text-green-400">
          <FiCheckCircle className="text-xl flex-shrink-0" />
          <div>
            <p className="font-semibold">Notification sent!</p>
            <p className="text-sm text-green-500">Users will see it the next time they open the app.</p>
          </div>
        </div>
      )}

      {/* Mode */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="font-semibold">Target Audience</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('all')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition ${mode === 'all' ? 'border-netflix-red bg-netflix-red/10' : 'border-gray-700 hover:border-gray-600'}`}
          >
            <div className={`p-2 rounded-lg ${mode === 'all' ? 'bg-netflix-red' : 'bg-gray-800'}`}>
              <FiUsers className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">All Users</p>
              <p className="text-xs text-gray-500">Broadcast to everyone</p>
            </div>
          </button>
          <button
            onClick={() => setMode('specific')}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border transition ${mode === 'specific' ? 'border-netflix-red bg-netflix-red/10' : 'border-gray-700 hover:border-gray-600'}`}
          >
            <div className={`p-2 rounded-lg ${mode === 'specific' ? 'bg-netflix-red' : 'bg-gray-800'}`}>
              <FiUser className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Specific Users</p>
              <p className="text-xs text-gray-500">Enter user IDs</p>
            </div>
          </button>
        </div>

        {mode === 'specific' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">User IDs (comma-separated)</label>
            <textarea
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              rows={3}
              placeholder="user_id_1, user_id_2, user_id_3…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h3 className="font-semibold">Message</h3>

        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Notification Type</label>
          <div className="grid grid-cols-2 gap-2">
            {NOTIF_TYPES.map((nt) => (
              <button
                key={nt.value}
                onClick={() => setType(nt.value)}
                className={`p-3 rounded-xl border text-left transition ${type === nt.value ? 'border-netflix-red bg-netflix-red/10' : 'border-gray-700 hover:border-gray-600'}`}
              >
                <p className={`text-xs font-semibold ${type === nt.value ? 'text-netflix-red' : 'text-white'}`}>{nt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{nt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Title <span className="text-red-500">*</span></label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New on Netflix: Stranger Things Season 5"
            maxLength={80}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red"
          />
          <p className="text-right text-xs text-gray-600 mt-1">{title.length}/80</p>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Message Body <span className="text-red-500">*</span></label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Watch the highly anticipated final season now available to stream…"
            maxLength={300}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red resize-none"
          />
          <p className="text-right text-xs text-gray-600 mt-1">{body.length}/300</p>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Deep Link URL (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/browse or /watch/content-id"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red font-mono"
          />
        </div>
      </div>

      {/* Preview */}
      {(title || body) && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="font-semibold mb-4 text-gray-400 text-sm uppercase tracking-wide">Preview</h3>
          <div className="bg-gray-800 rounded-xl p-4 flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-netflix-red rounded-xl flex items-center justify-center">
              <FiBell className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">{title || 'Notification Title'}</p>
              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{body || 'Notification body text…'}</p>
              <p className="text-gray-600 text-xs mt-1.5">now</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={send}
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full flex items-center justify-center gap-2 bg-netflix-red hover:bg-netflix-red-hover text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
      >
        <FiBell />
        {sending ? 'Sending…' : mode === 'all' ? 'Broadcast to All Users' : 'Send to Selected Users'}
      </button>
    </div>
  )
}
