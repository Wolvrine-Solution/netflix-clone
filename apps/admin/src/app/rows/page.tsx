'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiFilm,
} from 'react-icons/fi'
import { computeReorder } from '@/lib/rowReorder'

interface ContentItem {
  id: string
  title: string
  posterPath: string
  mediaType: string
}
interface Row {
  id: string
  title: string
  query: string
  order: number
  mediaType: string
  isActive: boolean
  _count: { contents: number }
}

const QUERY_PRESETS = ['trending', 'popular', 'top_rated', 'new_releases', 'coming_soon', 'custom']

export default function RowsPage() {
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken ?? ''
  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', query: '', mediaType: '', isActive: true })
  const [showAdd, setShowAdd] = useState(false)
  const [newForm, setNewForm] = useState({
    title: '',
    query: 'trending',
    mediaType: 'movie',
    isActive: true,
  })
  const [contentModal, setContentModal] = useState<string | null>(null)
  const [rowContent, setRowContent] = useState<ContentItem[]>([])

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/api/admin/rows`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as { data: Row[] }
    setRows(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  async function addRow() {
    await fetch(`${API}/api/admin/rows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newForm),
    })
    setShowAdd(false)
    setNewForm({ title: '', query: 'trending', mediaType: 'movie', isActive: true })
    await load()
  }

  async function saveEdit(id: string) {
    await fetch(`${API}/api/admin/rows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    })
    setEditId(null)
    await load()
  }

  async function deleteRow(id: string, title: string) {
    if (!confirm(`Delete row "${title}"?`)) return
    await fetch(`${API}/api/admin/rows/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await load()
  }

  async function moveRow(id: string, direction: 'up' | 'down') {
    const { rows: reordered, payload } = computeReorder(rows, id, direction)
    if (!reordered || !payload) return
    setRows(reordered)
    await fetch(`${API}/api/admin/rows/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rows: payload }),
    })
  }

  async function openContentModal(id: string) {
    setContentModal(id)
    const res = await fetch(`${API}/api/admin/rows/${id}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as { data: ContentItem[] }
    setRowContent(data.data ?? [])
  }

  async function removeFromRow(rowId: string, contentId: string) {
    await fetch(`${API}/api/admin/rows/${rowId}/content/${contentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setRowContent((c) => c.filter((item) => item.id !== contentId))
    await load()
  }

  const inputCls =
    'bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-netflix-red'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Browse Rows</h1>
          <p className="mt-1 text-gray-400">Configure and reorder rows on the browse page</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="bg-netflix-red hover:bg-netflix-red-hover flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
        >
          <FiPlus /> Add Row
        </button>
      </div>

      {/* Add Row Form */}
      {showAdd && (
        <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="font-semibold">New Row</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Row Title</label>
              <input
                value={newForm.title}
                onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Trending Now"
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Query Preset</label>
              <select
                value={newForm.query}
                onChange={(e) => setNewForm((f) => ({ ...f, query: e.target.value }))}
                className={`${inputCls} w-full`}
              >
                {QUERY_PRESETS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Media Type</label>
              <select
                value={newForm.mediaType}
                onChange={(e) => setNewForm((f) => ({ ...f, mediaType: e.target.value }))}
                className={`${inputCls} w-full`}
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="active-new"
                checked={newForm.isActive}
                onChange={(e) => setNewForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="accent-netflix-red"
              />
              <label htmlFor="active-new" className="text-sm">
                Active (visible on browse)
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addRow}
              disabled={!newForm.title}
              className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
            >
              Create Row
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-gray-400 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Row List */}
      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading rows…</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className={`rounded-xl border bg-gray-900 ${row.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'} transition hover:border-gray-700`}
            >
              {editId === row.id ? (
                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Title</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        className={`${inputCls} w-full`}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Query</label>
                      <select
                        value={editForm.query}
                        onChange={(e) => setEditForm((f) => ({ ...f, query: e.target.value }))}
                        className={`${inputCls} w-full`}
                      >
                        {QUERY_PRESETS.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Media Type</label>
                      <select
                        value={editForm.mediaType}
                        onChange={(e) => setEditForm((f) => ({ ...f, mediaType: e.target.value }))}
                        className={`${inputCls} w-full`}
                      >
                        <option value="movie">Movie</option>
                        <option value="tv">TV Show</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id={`active-${row.id}`}
                        checked={editForm.isActive}
                        onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                        className="accent-netflix-red"
                      />
                      <label htmlFor={`active-${row.id}`} className="text-sm">
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(row.id)}
                      className="bg-netflix-red hover:bg-netflix-red-hover flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition"
                    >
                      <FiCheck /> Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-gray-400 transition hover:text-white"
                    >
                      <FiX /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveRow(row.id, 'up')}
                      disabled={i === 0}
                      className="p-1 text-gray-600 transition hover:text-white disabled:opacity-20"
                    >
                      <FiChevronUp className="text-xs" />
                    </button>
                    <button
                      onClick={() => moveRow(row.id, 'down')}
                      disabled={i === rows.length - 1}
                      className="p-1 text-gray-600 transition hover:text-white disabled:opacity-20"
                    >
                      <FiChevronDown className="text-xs" />
                    </button>
                  </div>

                  <span className="w-5 font-mono text-xs text-gray-600">{row.order}</span>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{row.title}</p>
                      {!row.isActive && (
                        <span className="rounded bg-yellow-900/40 px-1.5 py-0.5 text-xs text-yellow-500">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Query: <span className="text-gray-400">{row.query}</span>
                      <span className="mx-2">·</span>
                      Type: <span className="text-gray-400">{row.mediaType}</span>
                      <span className="mx-2">·</span>
                      <span className="text-gray-400">{row._count.contents} items</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openContentModal(row.id)}
                      className="p-1.5 text-gray-500 transition hover:text-blue-400"
                      title="Manage content"
                    >
                      <FiFilm className="text-sm" />
                    </button>
                    <button
                      onClick={() => {
                        setEditId(row.id)
                        setEditForm({
                          title: row.title,
                          query: row.query,
                          mediaType: row.mediaType,
                          isActive: row.isActive,
                        })
                      }}
                      className="p-1.5 text-gray-500 transition hover:text-blue-400"
                    >
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button
                      onClick={() => deleteRow(row.id, row.title)}
                      className="p-1.5 text-gray-600 transition hover:text-red-400"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              No rows yet. Click "Add Row" to create one.
            </div>
          )}
        </div>
      )}

      {/* Content Modal */}
      {contentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setContentModal(null)} />
          <div className="relative z-10 flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-800 p-5">
              <h3 className="font-semibold">Row Content</h3>
              <button
                onClick={() => setContentModal(null)}
                className="text-gray-500 hover:text-white"
              >
                <FiX />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {rowContent.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No content in this row</p>
              ) : (
                rowContent.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-lg p-2 hover:bg-gray-800/50"
                  >
                    {item.posterPath ? (
                      <img
                        src={item.posterPath}
                        alt=""
                        className="h-12 w-8 flex-shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-8 flex-shrink-0 rounded bg-gray-800" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.mediaType}</p>
                    </div>
                    <button
                      onClick={() => removeFromRow(contentModal, item.id)}
                      className="p-1.5 text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
