'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { isGenreNameValid, normalizeGenreName } from '@/lib/genreValidation'

interface Genre {
  id: number
  name: string
  _count?: { contents: number }
}

export default function GenresPage() {
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken ?? ''
  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch(`${API}/api/admin/genres`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as { data: Genre[] }
    setGenres(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (token) load()
  }, [token])

  async function addGenre() {
    const name = normalizeGenreName(newName)
    if (!name) return
    setAdding(true)
    await fetch(`${API}/api/admin/genres`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
    setNewName('')
    setAdding(false)
    await load()
  }

  async function saveEdit(id: number) {
    const name = normalizeGenreName(editName)
    if (!name) return
    await fetch(`${API}/api/admin/genres/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
    setEditId(null)
    await load()
  }

  async function deleteGenre(id: number, name: string) {
    if (!confirm(`Delete genre "${name}"? It will be removed from all content.`)) return
    await fetch(`${API}/api/admin/genres/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    await load()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Genres</h1>
        <p className="mt-1 text-gray-400">{genres.length} genres</p>
      </div>

      {/* Add Genre */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="mb-4 font-semibold">Add Genre</h3>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGenre()}
            placeholder="Genre name (e.g. Action, Thriller…)"
            className="focus:border-netflix-red flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white outline-none"
          />
          <button
            onClick={addGenre}
            disabled={adding || !isGenreNameValid(newName)}
            className="bg-netflix-red hover:bg-netflix-red-hover flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
          >
            <FiPlus /> {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Genres are auto-synced from TMDB on import. Add custom genres here for manual content.
        </p>
      </div>

      {/* Genre List */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Loading genres…</div>
        ) : genres.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            No genres yet. Import content or add one above.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {genres.map((g) => (
              <div
                key={g.id}
                className="group flex items-center gap-4 px-5 py-3 transition hover:bg-gray-800/30"
              >
                <span className="w-8 font-mono text-xs text-gray-600">{g.id}</span>

                {editId === g.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(g.id)
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      autoFocus
                      className="focus:border-netflix-red flex-1 rounded border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white outline-none"
                    />
                    <button
                      onClick={() => saveEdit(g.id)}
                      className="p-1.5 text-green-400 transition hover:text-green-300"
                    >
                      <FiCheck />
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="p-1.5 text-gray-500 transition hover:text-gray-300"
                    >
                      <FiX />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{g.name}</span>
                    {g._count !== undefined && (
                      <span className="text-xs text-gray-500">{g._count.contents} items</span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => {
                          setEditId(g.id)
                          setEditName(g.name)
                        }}
                        className="p-1.5 text-gray-500 transition hover:text-blue-400"
                      >
                        <FiEdit2 className="text-sm" />
                      </button>
                      <button
                        onClick={() => deleteGenre(g.id, g.name)}
                        className="p-1.5 text-gray-600 transition hover:text-red-400"
                      >
                        <FiTrash2 className="text-sm" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
