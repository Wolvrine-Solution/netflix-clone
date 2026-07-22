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
    id: string
    title: string
    posterPath: string
    backdropPath: string
    runtime?: number | null
    mediaType: string
  }
}

export function ContinueWatchingRow() {
  const router = useRouter()
  const { activeProfile } = useProfileStore()
  const [items, setItems] = useState<WatchItem[]>([])

  useEffect(() => {
    if (!activeProfile) return
    api.history
      .get(activeProfile.id)
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
      <h2 className="text-lg font-semibold text-white md:text-xl">Continue Watching</h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((item) => {
          const pct = Math.round(item.progress * 100)
          const remaining = item.content.runtime
            ? Math.round(item.content.runtime * (1 - item.progress))
            : null

          return (
            <button
              key={item.id}
              onClick={() => router.push(`/watch/${item.content.id}`)}
              className="group relative overflow-hidden rounded-md focus:outline-none"
            >
              {/* Poster */}
              <img
                src={item.content.backdropPath || item.content.posterPath}
                alt={item.content.title}
                className="aspect-video w-full object-cover transition group-hover:brightness-75"
              />

              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                  <FiPlay className="fill-white text-xl text-white" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                <div
                  className="bg-netflix-red h-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Info */}
              <div className="absolute bottom-2 left-2 right-2">
                <p className="truncate text-xs font-medium text-white drop-shadow">
                  {item.content.title}
                </p>
                {remaining !== null && (
                  <p className="text-[10px] text-gray-300">{remaining}m left</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
