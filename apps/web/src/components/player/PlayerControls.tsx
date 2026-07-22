'use client'
import { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiArrowLeft,
  FiSkipForward,
  FiSkipBack,
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
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    isFullscreen,
    showControls,
    setPlaying,
    setMuted,
    setVolume,
    setFullscreen,
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
          className="pointer-events-none absolute inset-0 flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="pointer-events-auto flex items-center gap-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent p-4 md:p-6">
            <button
              onClick={onBack}
              className="tap-highlight-none grid h-10 w-10 place-items-center rounded-full text-white transition hover:bg-white/15"
              aria-label="Back"
            >
              <FiArrowLeft className="text-2xl" />
            </button>
            <div>
              <h1 className="text-base font-bold leading-tight md:text-lg">{content.title}</h1>
              {content.mediaType === 'tv' && (
                <p className="text-xs text-white/60 md:text-sm">S1 · E1</p>
              )}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="pointer-events-auto bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-6 pt-16 md:px-8 md:pb-8">
            {/* Progress bar */}
            <div className="group relative mb-4 cursor-pointer" onClick={seek}>
              <div className="h-1 overflow-hidden rounded-full bg-white/25 transition-all duration-150 group-hover:h-1.5">
                <div
                  className="bg-netflix-red relative h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Thumb dot */}
              <div
                className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-md transition group-hover:opacity-100"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Left controls */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Skip back */}
                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime -= 10
                  }}
                  className="tap-highlight-none grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
                  aria-label="-10 seconds"
                >
                  <FiSkipBack className="text-lg md:text-xl" />
                </button>

                {/* Play / Pause */}
                <button
                  onClick={() => setPlaying(!isPlaying)}
                  className="tap-highlight-none grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <FiPause className="text-2xl md:text-3xl" />
                  ) : (
                    <FiPlay className="text-2xl md:text-3xl" />
                  )}
                </button>

                {/* Skip forward */}
                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime += 10
                  }}
                  className="tap-highlight-none grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
                  aria-label="+10 seconds"
                >
                  <FiSkipForward className="text-lg md:text-xl" />
                </button>

                {/* Next episode */}
                {onNext && (
                  <button
                    onClick={onNext}
                    className="hidden rounded-lg border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white/50 hover:text-white sm:block"
                  >
                    Next
                  </button>
                )}

                {/* Volume — hidden on mobile */}
                <div className="group/vol hidden items-center gap-2 sm:flex">
                  <button
                    onClick={() => setMuted(!isMuted)}
                    className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <FiVolumeX className="text-xl" />
                    ) : (
                      <FiVolume2 className="text-xl" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value))
                      setMuted(false)
                    }}
                    className="accent-netflix-red w-0 cursor-pointer opacity-0 transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100"
                    aria-label="Volume"
                  />
                </div>

                {/* Time */}
                <span className="hidden text-xs tabular-nums text-white/70 sm:block md:text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="tap-highlight-none grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/15"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <FiMinimize className="text-xl" />
                ) : (
                  <FiMaximize className="text-xl" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
