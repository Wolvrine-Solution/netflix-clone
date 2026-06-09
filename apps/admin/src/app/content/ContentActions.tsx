'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FiEdit2, FiTrash2, FiStar } from 'react-icons/fi'
import { useSession } from 'next-auth/react'

interface Props {
  contentId: string
  contentTitle: string
  isFeatured: boolean
}

export function ContentActions({ contentId, contentTitle, isFeatured }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [deleting, setDeleting] = useState(false)

  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'
  const token = (session as { accessToken?: string })?.accessToken ?? ''

  async function handleDelete() {
    if (!confirm(`Delete "${contentTitle}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`${API}/api/admin/content/${contentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    router.refresh()
  }

  async function toggleFeatured() {
    await fetch(`${API}/api/admin/content/${contentId}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    })
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={toggleFeatured}
        title={isFeatured ? 'Unfeature' : 'Set as Featured'}
        className={`p-1.5 rounded transition ${isFeatured ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-600 hover:text-yellow-400'}`}
      >
        <FiStar className="text-sm" />
      </button>
      <a
        href={`/content/${contentId}`}
        className="p-1.5 rounded text-gray-500 hover:text-blue-400 transition"
        title="Edit"
      >
        <FiEdit2 className="text-sm" />
      </a>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="p-1.5 rounded text-gray-600 hover:text-red-400 transition disabled:opacity-40"
        title="Delete"
      >
        <FiTrash2 className="text-sm" />
      </button>
    </div>
  )
}
