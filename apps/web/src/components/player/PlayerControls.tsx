'use client'
import { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiArrowLeft, FiSkipForward, FiSkipBack,
} from 'react-icons/fi'
import { usePlayerStore } from '@/store/usePlayerStore'
import type { ContentItem } from '@netflix/types'

interface PlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement>
  content: ContentItem
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.floor(secs % 60)
  return h > 0
    ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    : `${m}:${s.toString().padStart(2, '0')}`
}

export function PlayerControls({ videoRef, content, onBack, onNext }: PlayerControlsProps) {
  const {
    isPlaying, isMuted, volume, currentTime, duration,
    isFullscreen, showControls,
    setPlaying, setMuted, setVolume, setFullscreen,
  } = usePlayerStore()

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setFullscreen(false)
    } else {
      videoRef.current?.closest('div')?.requestFullscreen()
      setFullscreen(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    if (videoRef.current) videoRef.current.currentTime = pct * duration
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <AnimatePresence>
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 md:p-6 flex items-center gap-4 pointer-events-auto">
            <button
              onClick={onBack}
              className="grid place-items-center w-10 h-10 rounded-full hover:bg-white/15 text-white transition tap-highlight-none"
              aria-label="Back"
            >
              <FiArrowLeft className="text-2xl" />
            </button>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-tight">{content.title}</h1>
              {content.mediaType === 'tv' && (
                <p className="text-xs md:text-sm text-white/60">S1 · E1</p>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 md:px-8 pb-6 md:pb-8 pt-16 pointer-events-auto">
            {/* Progress bar */}
            <div className="relative mb-4 group cursor-pointer" onClick={seek}>
              <div className="h-1 group-hover:h-1.5 transition-all duration-150 bg-white/25 rounded-full overflow-hidden">
                <div
                  className="h-full bg-netflix-red rounded-full relative"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Thumb dot */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition pointer-events-none"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Left controls */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Skip back */}
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10 }}
                  className="grid place-items-center w-9 h-9 rounded-full hover:bg-white/15 transition tap-highlight-none"
                  aria-label="-10 seconds"
                >
                  <FiSkipBack className="text-lg md:text-xl" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={() => setPlaying(!isPlaying)}
                  className="grid place-items-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition tap-highlight-none"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying
                    ? <FiPause className="text-2xl md:text-3xl" />
                    : <FiPlay className="text-2xl md:text-3xl" />
                  }
                </button>

                {/* Skip forward */}
                <button
                  onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10 }}
                  className="grid place-items-center w-9 h-9 rounded-full hover:bg-white/15 transition tap-highlight-none"
                  aria-label="+10 seconds"
                >
                  <FiSkipForward className="text-lg md:text-xl" />
                </button>

                {/* Next episode */}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="hidden sm:block text-xs text-white/70 hover:text-white transition px-3 py-1 rounded-lg border border-white/20 hover:border-white/50"
                  >
                    Next
                  </button>
                )}

                {/* Volume — hidden on mobile */}
                <div className="hidden sm:flex items-center gap-2 group/vol">
                  <button
                    onClick={() => setMuted(!isMuted)}
                    className="grid place-items-center w-9 h-9 rounded-full hover:bg-white/15 transition"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? <FiVolumeX className="text-xl" /> : <FiVolume2 className="text-xl" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                    className="w-0 group-hover/vol:w-20 opacity-0 group-hover/vol:opacity-100 transition-all duration-200 accent-netflix-red cursor-pointer"
                    aria-label="Volume"
                  />
                </div>

                {/* Time */}
                <span className="hidden sm:block text-xs md:text-sm text-white/70 tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="grid place-items-center w-9 h-9 rounded-full hover:bg-white/15 transition tap-highlight-none"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <FiMinimize className="text-xl" /> : <FiMaximize className="text-xl" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
