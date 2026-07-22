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
        payload.userIds = userIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      }
      await fetch(`${API}/api/admin/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      setSent(true)
      setTitle('')
      setBody('')
      setLink('')
      setUserIds('')
      setTimeout(() => setSent(false), 5000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="mt-1 text-gray-400">Broadcast messages to your users</p>
      </div>

      {sent && (
        <div className="flex items-center gap-3 rounded-xl border border-green-700/50 bg-green-900/30 p-4 text-green-400">
          <FiCheckCircle className="flex-shrink-0 text-xl" />
          <div>
            <p className="font-semibold">Notification sent!</p>
            <p className="text-sm text-green-500">
              Users will see it the next time they open the app.
            </p>
          </div>
        </div>
      )}

      {/* Mode */}
      <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="font-semibold">Target Audience</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setMode('all')}
            className={`flex flex-1 items-center gap-3 rounded-xl border p-4 transition ${mode === 'all' ? 'border-netflix-red bg-netflix-red/10' : 'border-gray-700 hover:border-gray-600'}`}
          >
            <div className={`rounded-lg p-2 ${mode === 'all' ? 'bg-netflix-red' : 'bg-gray-800'}`}>
              <FiUsers className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">All Users</p>
              <p className="text-xs text-gray-500">Broadcast to everyone</p>
            </div>
          </button>
          <button
            onClick={() => setMode('specific')}
            className={`flex flex-1 items-center gap-3 rounded-xl border p-4 transition ${mode === 'specific' ? 'border-netflix-red bg-netflix-red/10' : 'border-gray-700 hover:border-gray-600'}`}
          >
            <div
              className={`rounded-lg p-2 ${mode === 'specific' ? 'bg-netflix-red' : 'bg-gray-800'}`}
            >
              <FiUser className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">Specific Users</p>
              <p className="text-xs text-gray-500">Enter user IDs</p>
            </div>
          </button>
        </div>

        {mode === 'specific' && (
          <div>
            <label className="mb-1.5 block text-xs text-gray-400">User IDs (comma-separated)</label>
            <textarea
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              rows={3}
              placeholder="user_id_1, user_id_2, user_id_3…"
              className="focus:border-netflix-red w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white outline-none"
            />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="font-semibold">Message</h3>

        <div>
          <label className="mb-1.5 block text-xs text-gray-400">Notification Type</label>
          <div className="grid grid-cols-2 gap-2">
            {NOTIF_TYPES.map((nt) => (
              <button
                key={nt.value}
                onClick={() => setType(nt.value)}
                className={`rounded-xl border p-3 text-left transition ${type === nt.value ? 'border-netflix-red bg-netflix-red/10' : 'border-gray-700 hover:border-gray-600'}`}
              >
                <p
                  className={`text-xs font-semibold ${type === nt.value ? 'text-netflix-red' : 'text-white'}`}
                >
                  {nt.label}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">{nt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-gray-400">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New on Netflix: Stranger Things Season 5"
            maxLength={80}
            className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
          />
          <p className="mt-1 text-right text-xs text-gray-600">{title.length}/80</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-gray-400">
            Message Body <span className="text-red-500">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Watch the highly anticipated final season now available to stream…"
            maxLength={300}
            className="focus:border-netflix-red w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
          />
          <p className="mt-1 text-right text-xs text-gray-600">{body.length}/300</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-gray-400">Deep Link URL (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/browse or /watch/content-id"
            className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 font-mono text-sm text-white outline-none"
          />
        </div>
      </div>

      {/* Preview */}
      {(title || body) && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Preview
          </h3>
          <div className="flex gap-3 rounded-xl bg-gray-800 p-4">
            <div className="bg-netflix-red flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
              <FiBell className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title || 'Notification Title'}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
                {body || 'Notification body text…'}
              </p>
              <p className="mt-1.5 text-xs text-gray-600">now</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={send}
        disabled={sending || !title.trim() || !body.trim()}
        className="bg-netflix-red hover:bg-netflix-red-hover flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition disabled:opacity-50"
      >
        <FiBell />
        {sending
          ? 'Sending…'
          : mode === 'all'
            ? 'Broadcast to All Users'
            : 'Send to Selected Users'}
      </button>
    </div>
  )
}
