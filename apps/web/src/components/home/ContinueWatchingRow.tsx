'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiPlay } from 'react-icons/fi'
import { api } from '@/lib/api'
import { useProfileStore } from '@/store/useProfileStore'

interface WatchItem {
  id: string
  progress: number
  content: {
    id: string; title: string; posterPath: string; backdropPath: string
    runtime?: number | null; mediaType: string
  }
}

export function ContinueWatchingRow() {
  const router = useRouter()
  const { activeProfile } = useProfileStore()
  const [items, setItems] = useState<WatchItem[]>([])

  useEffect(() => {
    if (!activeProfile) return
    api.history.get(activeProfile.id)
      .then((res) => {
        const data = (res.data as { data?: WatchItem[] }).data ?? []
        const inProgress = data.filter((w) => w.progress > 0.02 && w.progress < 0.97)
        setItems(inProgress.slice(0, 12))
      })
      .catch(() => {})
  }, [activeProfile])

  if (items.length === 0) return null

  return (
    <div className="space-y-2 px-4 md:px-12">
      <h2 className="text-lg md:text-xl font-semibold text-white">Continue Watching</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {items.map((item) => {
          const pct = Math.round(item.progress * 100)
          const remaining = item.content.runtime
            ? Math.round(item.content.runtime * (1 - item.progress))
            : null

          return (
            <button
              key={item.id}
              onClick={() => router.push(`/watch/${item.content.id}`)}
              className="relative rounded-md overflow-hidden group focus:outline-none"
            >
              {/* Poster */}
              <img
                src={item.content.backdropPath || item.content.posterPath}
                alt={item.content.title}
                className="w-full aspect-video object-cover transition group-hover:brightness-75"
              />

              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <div className="bg-white/20 rounded-full p-2 backdrop-blur-sm">
                  <FiPlay className="text-white text-xl fill-white" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                <div className="h-full bg-netflix-red transition-all" style={{ width: `${pct}%` }} />
              </div>

              {/* Info */}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-medium truncate drop-shadow">{item.content.title}</p>
                {remaining !== null && (
                  <p className="text-gray-300 text-[10px]">{remaining}m left</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
