'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FiMoreVertical, FiShield, FiSlash, FiCreditCard, FiTrash2 } from 'react-icons/fi'

interface Props {
  userId: string
  userName: string
  currentRole: 'USER' | 'ADMIN'
  isSuspended: boolean
}

export function UserActions({ userId, userName, currentRole, isSuspended }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken ?? ''
  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'
  const [open, setOpen] = useState(false)
  const [subModal, setSubModal] = useState(false)
  const [subPlan, setSubPlan] = useState('STANDARD')
  const [subStatus, setSubStatus] = useState('ACTIVE')

  async function updateUser(patch: Record<string, unknown>) {
    await fetch(`${API}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    })
    router.refresh()
    setOpen(false)
  }

  async function toggleSuspend() {
    if (!confirm(isSuspended ? `Unsuspend ${userName}?` : `Suspend ${userName}?`)) return
    await updateUser({ isSuspended: !isSuspended })
  }

  async function toggleRole() {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    if (!confirm(`Change ${userName}'s role to ${newRole}?`)) return
    await updateUser({ role: newRole })
  }

  async function saveSubscription() {
    await fetch(`${API}/api/admin/users/${userId}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: subPlan, status: subStatus }),
    })
    setSubModal(false)
    router.refresh()
  }

  async function deleteUser() {
    if (!confirm(`Permanently delete ${userName}? This cannot be undone.`)) return
    await fetch(`${API}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    router.refresh()
  }

  return (
    <>
      <div className="relative">
        <button onClick={() => setOpen((v) => !v)} className="p-1.5 text-gray-500 hover:text-white transition rounded">
          <FiMoreVertical className="text-sm" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-8 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-52 py-1 text-sm">
              <button onClick={toggleRole} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition text-left">
                <FiShield className="text-blue-400" />
                {currentRole === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
              </button>
              <button onClick={toggleSuspend} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition text-left">
                <FiSlash className={isSuspended ? 'text-green-400' : 'text-yellow-400'} />
                {isSuspended ? 'Unsuspend' : 'Suspend Account'}
              </button>
              <button onClick={() => { setOpen(false); setSubModal(true) }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition text-left">
                <FiCreditCard className="text-purple-400" />
                Manage Subscription
              </button>
              <div className="border-t border-gray-700 my-1" />
              <button onClick={deleteUser} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 transition text-left text-red-400">
                <FiTrash2 />
                Delete User
              </button>
            </div>
          </>
        )}
      </div>

      {/* Subscription Modal */}
      {subModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSubModal(false)} />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-sm p-6 space-y-5 z-10">
            <h3 className="font-semibold text-lg">Manage Subscription</h3>
            <p className="text-sm text-gray-400">{userName}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Plan</label>
                <select value={subPlan} onChange={(e) => setSubPlan(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red">
                  <option value="BASIC">Basic</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Status</label>
                <select value={subStatus} onChange={(e) => setSubStatus(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red">
                  <option value="ACTIVE">Active</option>
                  <option value="TRIALING">Trialing</option>
                  <option value="PAST_DUE">Past Due</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={saveSubscription} className="flex-1 bg-netflix-red hover:bg-netflix-red-hover text-white py-2 rounded-lg text-sm font-medium transition">Save</button>
              <button onClick={() => setSubModal(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
