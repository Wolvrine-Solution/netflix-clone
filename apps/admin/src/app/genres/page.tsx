'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi'
import { isGenreNameValid, normalizeGenreName } from '@/lib/genreValidation'

interface Genre { id: number; name: string; _count?: { contents: number } }

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
    const res = await fetch(`${API}/api/admin/genres`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json() as { data: Genre[] }
    setGenres(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (token) load() }, [token])

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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Genres</h1>
        <p className="text-gray-400 mt-1">{genres.length} genres</p>
      </div>

      {/* Add Genre */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="font-semibold mb-4">Add Genre</h3>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGenre()}
            placeholder="Genre name (e.g. Action, Thriller…)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-netflix-red"
          />
          <button
            onClick={addGenre}
            disabled={adding || !isGenreNameValid(newName)}
            className="bg-netflix-red hover:bg-netflix-red-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <FiPlus /> {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Genres are auto-synced from TMDB on import. Add custom genres here for manual content.
        </p>
      </div>

      {/* Genre List */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading genres…</div>
        ) : genres.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No genres yet. Import content or add one above.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {genres.map((g) => (
              <div key={g.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/30 transition group">
                <span className="text-gray-600 font-mono text-xs w-8">{g.id}</span>

                {editId === g.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(g.id); if (e.key === 'Escape') setEditId(null) }}
                      autoFocus
                      className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-netflix-red"
                    />
                    <button onClick={() => saveEdit(g.id)} className="p-1.5 text-green-400 hover:text-green-300 transition"><FiCheck /></button>
                    <button onClick={() => setEditId(null)} className="p-1.5 text-gray-500 hover:text-gray-300 transition"><FiX /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{g.name}</span>
                    {g._count !== undefined && (
                      <span className="text-xs text-gray-500">{g._count.contents} items</span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => { setEditId(g.id); setEditName(g.name) }}
                        className="p-1.5 text-gray-500 hover:text-blue-400 transition"
                      ><FiEdit2 className="text-sm" /></button>
                      <button
                        onClick={() => deleteGenre(g.id, g.name)}
                        className="p-1.5 text-gray-600 hover:text-red-400 transition"
                      ><FiTrash2 className="text-sm" /></button>
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
