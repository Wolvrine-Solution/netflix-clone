'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBResult[]>([])
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState<number | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setSearching(true)
    const res = await fetch(`/api/admin/tmdb-search?q=${encodeURIComponent(query)}`)
    const data = await res.json() as { results: TMDBResult[] }
    setResults(data.results ?? [])
    setSearching(false)
  }

  const importContent = async (item: TMDBResult) => {
    setImporting(item.id)
    await fetch('/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId: item.id, mediaType: item.media_type }),
    })
    setImporting(null)
    router.push('/content')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add Content from TMDB</h1>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white text-sm">← Back</button>
      </div>

      <div className="flex gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Search TMDB..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-3 text-white outline-none focus:border-netflix-red"
        />
        <button
          onClick={search}
          disabled={searching}
          className="bg-netflix-red hover:bg-netflix-red-hover text-white px-6 py-3 rounded font-medium disabled:opacity-60 transition"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').map((item) => (
          <div key={item.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group">
            {item.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                alt={item.title ?? item.name ?? ''}
                className="w-full aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-500 text-sm p-4 text-center">
                {item.title ?? item.name}
              </div>
            )}
            <div className="p-3">
              <p className="font-medium text-sm truncate">{item.title ?? item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${item.media_type === 'movie' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                  {item.media_type}
                </span>
                <span className="text-xs text-yellow-400">{item.vote_average.toFixed(1)}</span>
              </div>
              <button
                onClick={() => importContent(item)}
                disabled={importing === item.id}
                className="mt-2 w-full bg-netflix-red hover:bg-netflix-red-hover text-white text-xs py-1.5 rounded disabled:opacity-60 transition"
              >
                {importing === item.id ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
