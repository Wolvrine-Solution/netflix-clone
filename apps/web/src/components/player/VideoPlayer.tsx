'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useWatchProgress } from '@/hooks/useWatchProgress'
import { PlayerControls } from './PlayerControls'
import type { ContentItem } from '@netflix/types'

interface VideoPlayerProps {
  content: ContentItem
}

// Public domain demo stream
const DEMO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export function VideoPlayer({ content }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const { saveProgress } = useWatchProgress(content.id)
  const {
    isPlaying, isMuted, volume, showControls,
    setPlaying, setMuted, setVolume, setCurrentTime,
    setDuration, setLoading, setShowControls, setFullscreen, reset,
  } = usePlayerStore()

  const [showSkipIntro, setShowSkipIntro] = useState(false)

  useEffect(() => {
    reset()
    const video = videoRef.current
    if (!video) return

    const onLoadedData = () => setLoading(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const progress = video.duration > 0 ? video.currentTime / video.duration : 0
      saveProgress(progress)
      setShowSkipIntro(video.currentTime >= 15 && video.currentTime <= 90)
    }
    const onDurationChange = () => setDuration(video.duration)

    video.addEventListener('loadeddata', onLoadedData)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)

    return () => {
      video.removeEventListener('loadeddata', onLoadedData)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
    }
  }, [setPlaying, setCurrentTime, setDuration, setLoading, saveProgress, reset])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.muted = isMuted
  }, [volume, isMuted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) video.play().catch(() => {})
    else video.pause()
  }, [isPlaying])

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying, setShowControls])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); setPlaying(!isPlaying); break
        case 'f': case 'F':
          if (document.fullscreenElement) { document.exitFullscreen(); setFullscreen(false) }
          else { containerRef.current?.requestFullscreen(); setFullscreen(true) }
          break
        case 'm': case 'M': setMuted(!isMuted); break
        case 'ArrowRight': video.currentTime += 10; break
        case 'ArrowLeft': video.currentTime -= 10; break
        case 'Escape': router.back(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, isMuted, setPlaying, setMuted, setFullscreen, router])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black cursor-none"
      onMouseMove={resetHideTimer}
      onClick={() => setPlaying(!isPlaying)}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video
        ref={videoRef}
        src={DEMO_SRC}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
      />

      {/* Skip Intro */}
      {showSkipIntro && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (videoRef.current) videoRef.current.currentTime += 75
            setShowSkipIntro(false)
          }}
          className="absolute bottom-24 right-8 border-2 border-white text-white px-6 py-2 text-sm font-semibold hover:bg-white hover:text-black transition z-10"
        >
          Skip Intro
        </button>
      )}

      <PlayerControls
        videoRef={videoRef}
        content={content}
        onBack={() => router.back()}
      />
    </div>
  )
}
