'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiInfo, FiVolume2, FiVolumeX } from 'react-icons/fi'
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
    return (
      <div className="from-netflix-dark-gray to-netflix-black h-[60vh] bg-gradient-to-b md:h-[85vh]">
        <div className="absolute bottom-1/4 left-4 space-y-4 md:left-16">
          <div className="skeleton h-12 w-64 md:w-96" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-12 w-48 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[60vh] min-h-[460px] overflow-hidden md:h-[88vh]">
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
              className="h-full w-full object-cover object-top"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trailer */}
      {showTrailer && content.trailerKey && (
        <div className="absolute inset-0">
          <iframe
            src={`https://www.youtube.com/embed/${content.trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${content.trailerKey}&modestbranding=1&showinfo=0&rel=0`}
            className="h-full w-full scale-150"
            allow="autoplay"
            title="Trailer"
          />
        </div>
      )}

      {/* Cinematic gradient scrims */}
      <div className="from-netflix-black via-netflix-black/50 absolute inset-0 bg-gradient-to-r to-transparent" />
      <div className="from-netflix-black via-netflix-black/40 absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t to-transparent" />
      <div className="from-netflix-black absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent" />

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-[12%] left-4 right-4 max-w-xl space-y-3 md:bottom-[18%] md:left-16 md:right-auto md:space-y-5"
      >
        <h1 className="tracking-tightest text-4xl font-black leading-[0.95] drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] md:text-7xl">
          {content.title}
        </h1>
        <div className="flex items-center gap-2.5 text-xs font-medium md:text-sm">
          <span className="font-bold text-green-400">{Math.round(content.rating * 10)}% Match</span>
          <span className="text-white/70">{getReleaseYear(content.releaseDate)}</span>
          {content.runtime && (
            <span className="text-white/70">{formatRuntime(content.runtime)}</span>
          )}
          <span className="rounded border border-white/30 px-1.5 py-px text-[0.65rem] text-white/80">
            {content.maturityRating}
          </span>
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-white/85 md:line-clamp-none md:text-lg">
          {truncate(content.description, 200)}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="primary"
            size="lg"
            className="shadow-card flex flex-1 items-center justify-center gap-2 !rounded-xl transition-transform hover:scale-[1.03] active:scale-95 sm:flex-none"
            onClick={() => router.push(`/watch/${content.id}`)}
          >
            <FiPlay className="text-xl" /> Play
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="glass flex flex-1 items-center justify-center gap-2 !rounded-xl transition-transform hover:scale-[1.03] active:scale-95 sm:flex-none"
            onClick={() => openModal(content)}
          >
            <FiInfo className="text-xl" /> More Info
          </Button>
        </div>
      </motion.div>

      {/* Mute toggle */}
      {showTrailer && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="absolute bottom-[12%] right-6 grid h-10 w-10 place-items-center rounded-full border border-white/40 text-white/90 transition hover:border-white/70 hover:bg-white/10 md:bottom-[18%] md:right-12"
        >
          {isMuted ? <FiVolumeX /> : <FiVolume2 />}
        </button>
      )}
    </div>
  )
}
