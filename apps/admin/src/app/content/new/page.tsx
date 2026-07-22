'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FiSearch, FiDownload, FiEdit3 } from 'react-icons/fi'
import { buildManualCreateBody, isManualContentValid } from '@/lib/contentForm'

interface TMDBResult {
  id: number
  title?: string
  name?: string
  media_type: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  release_date?: string
  first_air_date?: string
}

export default function NewContentPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken ?? ''
  const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'

  const [mode, setMode] = useState<'tmdb' | 'manual'>('tmdb')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBResult[]>([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState<number | null>(null)

  // Manual create form
  const [manual, setManual] = useState({
    title: '',
    mediaType: 'movie',
    description: '',
    posterPath: '',
    backdropPath: '',
    releaseDate: '',
    rating: '7.0',
    maturityRating: 'TV-MA',
    status: 'PUBLISHED',
    videoUrl: '',
    trailerKey: '',
  })

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    const res = await fetch(`${API}/api/admin/content/tmdb-search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await res.json()) as { results?: TMDBResult[] }
    setResults(data.results ?? [])
    setSearching(false)
  }

  async function importContent(item: TMDBResult) {
    setImporting(item.id)
    try {
      const res = await fetch(`${API}/api/admin/content/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tmdbId: item.id, mediaType: item.media_type }),
      })
      const data = (await res.json()) as { data?: { id?: string }; message?: string }
      if (data.message === 'Already imported') {
        alert('This title is already in your library.')
      } else {
        router.push(`/content/${data.data?.id}`)
      }
    } finally {
      setImporting(null)
    }
  }

  async function createManual() {
    const res = await fetch(`${API}/api/admin/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(buildManualCreateBody(manual)),
    })
    const data = (await res.json()) as { data?: { id?: string } }
    if (data.data?.id) router.push(`/content/${data.data.id}`)
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-1 text-sm text-gray-500 hover:text-white"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Add Content</h1>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex w-fit gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
        <button
          onClick={() => setMode('tmdb')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${mode === 'tmdb' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
        >
          <FiDownload /> Import from TMDB
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${mode === 'manual' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}
        >
          <FiEdit3 /> Create Manually
        </button>
      </div>

      {/* ── TMDB Import ── */}
      {mode === 'tmdb' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="Search movies or TV shows on TMDB…"
                className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-900 py-3 pl-9 pr-4 text-white outline-none"
              />
            </div>
            <button
              onClick={search}
              disabled={searching}
              className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-6 py-3 font-medium text-white transition disabled:opacity-60"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {results.map((item) => (
              <div
                key={item.id}
                className="group overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition hover:border-gray-700"
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                    alt=""
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[2/3] w-full items-center justify-center bg-gray-800 p-3 text-center text-xs text-gray-600">
                    No Poster
                  </div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{item.title ?? item.name}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${item.media_type === 'movie' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}
                    >
                      {item.media_type}
                    </span>
                    <span className="text-xs text-yellow-400">{item.vote_average.toFixed(1)}</span>
                  </div>
                  <button
                    onClick={() => importContent(item)}
                    disabled={importing === item.id}
                    className="bg-netflix-red hover:bg-netflix-red-hover mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-white transition disabled:opacity-60"
                  >
                    {importing === item.id ? (
                      <>
                        <span className="animate-spin">↻</span> Importing…
                      </>
                    ) : (
                      <>
                        <FiDownload /> Import
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {results.length === 0 && query && !searching && (
            <div className="py-12 text-center text-gray-600">
              <p>No results for &quot;{query}&quot;</p>
            </div>
          )}
        </>
      )}

      {/* ── Manual Create ── */}
      {mode === 'manual' && (
        <div className="max-w-2xl space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-lg font-semibold">Create Content Manually</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'title', label: 'Title', type: 'text' },
              { k: 'releaseDate', label: 'Release Date', type: 'date' },
              { k: 'rating', label: 'Rating (0–10)', type: 'number' },
              { k: 'trailerKey', label: 'YouTube Trailer Key', type: 'text' },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="mb-1 block text-xs text-gray-400">{label}</label>
                <input
                  type={type}
                  value={(manual as Record<string, string>)[k]}
                  onChange={(e) => setManual((m) => ({ ...m, [k]: e.target.value }))}
                  className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs text-gray-400">Media Type</label>
              <select
                value={manual.mediaType}
                onChange={(e) => setManual((m) => ({ ...m, mediaType: e.target.value }))}
                className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Status</label>
              <select
                value={manual.status}
                onChange={(e) => setManual((m) => ({ ...m, status: e.target.value }))}
                className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Description</label>
            <textarea
              value={manual.description}
              onChange={(e) => setManual((m) => ({ ...m, description: e.target.value }))}
              rows={3}
              className="focus:border-netflix-red w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'posterPath', label: 'Poster Image URL' },
              { k: 'backdropPath', label: 'Backdrop Image URL' },
              { k: 'videoUrl', label: 'Video URL (MP4/HLS)' },
            ].map(({ k, label }) => (
              <div key={k} className={k === 'videoUrl' ? 'col-span-2' : ''}>
                <label className="mb-1 block text-xs text-gray-400">{label}</label>
                <input
                  value={(manual as Record<string, string>)[k]}
                  onChange={(e) => setManual((m) => ({ ...m, [k]: e.target.value }))}
                  placeholder="https://…"
                  className="focus:border-netflix-red w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            ))}
          </div>
          <button
            onClick={createManual}
            disabled={!isManualContentValid(manual)}
            className="bg-netflix-red hover:bg-netflix-red-hover rounded-lg px-6 py-2.5 font-medium text-white transition disabled:opacity-50"
          >
            Create Content
          </button>
        </div>
      )}
    </div>
  )
}
