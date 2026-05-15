'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiInfo } from 'react-icons/fi'
import { Button } from '@netflix/ui'
import { useModalStore } from '@/store/useModalStore'
import { cn, truncate, formatRuntime, getReleaseYear } from '@/lib/utils'
import type { ContentItem } from '@netflix/types'

interface HeroBannerProps {
  content: ContentItem | null
}

export function HeroBanner({ content }: HeroBannerProps) {
  const router = useRouter()
  const { openModal } = useModalStore()
  const [showTrailer, setShowTrailer] = useState(false)
  const [isMuted, setIsMuted] = useState(true)

  useEffect(() => {
    if (!content?.trailerKey) return
    const timer = setTimeout(() => setShowTrailer(true), 3000)
    return () => clearTimeout(timer)
  }, [content])

  if (!content) {
    return <div className="h-[85vh] bg-gradient-to-b from-netflix-dark-gray to-netflix-black" />
  }

  return (
    <div className="relative h-[85vh] overflow-hidden">
      {/* Backdrop */}
      <AnimatePresence>
        {!showTrailer && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <img
              src={content.backdropPath}
              alt={content.title}
              className="w-full h-full object-cover object-top"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trailer */}
      {showTrailer && content.trailerKey && (
        <div className="absolute inset-0">
          <iframe
            src={`https://www.youtube.com/embed/${content.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${content.trailerKey}&modestbranding=1&showinfo=0&rel=0`}
            className="w-full h-full scale-150"
            allow="autoplay"
            title="Trailer"
          />
        </div>
      )}

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-netflix-black/80 via-netflix-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-netflix-black to-transparent" />

      {/* Info */}
      <div className="absolute bottom-1/4 left-4 md:left-16 max-w-xl space-y-4">
        <h1 className="text-4xl md:text-6xl font-black leading-tight drop-shadow-lg">
          {content.title}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-green-400 font-semibold">{Math.round(content.rating * 10)}% Match</span>
          <span className="text-netflix-light-gray">{getReleaseYear(content.releaseDate)}</span>
          {content.runtime && <span className="text-netflix-light-gray">{formatRuntime(content.runtime)}</span>}
          <span className="border border-netflix-light-gray text-netflix-light-gray text-xs px-1">{content.maturityRating}</span>
        </div>
        <p className="text-sm md:text-base text-gray-200 leading-relaxed hidden md:block">
          {truncate(content.description, 200)}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => router.push(`/watch/${content.id}`)}
          >
            <FiPlay className="text-xl" /> Play
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => openModal(content)}
          >
            <FiInfo className="text-xl" /> More Info
          </Button>
        </div>
      </div>

      {/* Mute toggle */}
      {showTrailer && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-1/4 right-8 border border-white/50 rounded-full p-2 hover:bg-white/10 transition"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      )}
    </div>
  )
}
