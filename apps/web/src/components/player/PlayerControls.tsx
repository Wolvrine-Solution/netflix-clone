'use client'
import { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiArrowLeft, FiSkipForward, FiSkipBack
} from 'react-icons/fi'
import { usePlayerStore } from '@/store/usePlayerStore'
import { formatRuntime } from '@/lib/utils'
import type { ContentItem } from '@netflix/types'

interface PlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement>
  content: ContentItem
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PlayerControls({ videoRef, content, onBack, onNext, onPrev }: PlayerControlsProps) {
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
    const pct = (e.clientX - rect.left) / rect.width
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
          className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top bar */}
          <div className="bg-gradient-to-b from-black/80 to-transparent p-6 flex items-center gap-4 pointer-events-auto">
            <button onClick={onBack} className="text-white hover:text-netflix-light-gray transition">
              <FiArrowLeft className="text-2xl" />
            </button>
            <div>
              <h1 className="font-semibold text-lg">{content.title}</h1>
              {content.mediaType === 'tv' && <p className="text-sm text-netflix-light-gray">S1:E1</p>}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="bg-gradient-to-t from-black/80 to-transparent px-6 pb-6 pt-12 pointer-events-auto">
            {/* Progress bar */}
            <div
              className="w-full h-1 bg-white/30 rounded cursor-pointer mb-4 group hover:h-2 transition-all"
              onClick={seek}
            >
              <div
                className="h-full bg-netflix-red rounded relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-netflix-red rounded-full opacity-0 group-hover:opacity-100" />
              </div>
            </div>

            {/* Buttons row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime -= 10 }}>
                  <FiSkipBack className="text-xl hover:text-netflix-light-gray transition" />
                </button>
                <button onClick={() => setPlaying(!isPlaying)}>
                  {isPlaying
                    ? <FiPause className="text-3xl hover:text-netflix-light-gray transition" />
                    : <FiPlay className="text-3xl hover:text-netflix-light-gray transition" />
                  }
                </button>
                <button onClick={() => { if (videoRef.current) videoRef.current.currentTime += 10 }}>
                  <FiSkipForward className="text-xl hover:text-netflix-light-gray transition" />
                </button>
                {onNext && (
                  <button onClick={onNext} title="Next Episode" className="text-sm text-white/70 hover:text-white transition px-2 py-1 rounded border border-white/20 hover:border-white/50">
                    Next
                  </button>
                )}

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setMuted(!isMuted)}>
                    {isMuted || volume === 0
                      ? <FiVolumeX className="text-xl" />
                      : <FiVolume2 className="text-xl" />
                    }
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
                    className="w-20 accent-white"
                  />
                </div>

                <span className="text-sm text-white/80">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <button onClick={toggleFullscreen}>
                {isFullscreen
                  ? <FiMinimize className="text-xl hover:text-netflix-light-gray transition" />
                  : <FiMaximize className="text-xl hover:text-netflix-light-gray transition" />
                }
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
