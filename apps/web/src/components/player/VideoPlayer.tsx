'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/store/usePlayerStore'
import { useWatchProgress } from '@/hooks/useWatchProgress'
import { PlayerControls } from './PlayerControls'
import type { ContentItem } from '@netflix/types'

interface VideoPlayerProps {
  content: ContentItem
  videoUrl?: string | null
  onNext?: () => void
  onPrev?: () => void
  episodeInfo?: { season: number; episode: number; title: string } | null
}

const DEMO_SRC =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

export function VideoPlayer({ content, videoUrl, onNext, onPrev, episodeInfo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hlsRef = useRef<unknown>(null)
  const router = useRouter()
  const { saveProgress } = useWatchProgress(content.id)
  const {
    isPlaying,
    isMuted,
    volume,
    showControls,
    setPlaying,
    setMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setLoading,
    setShowControls,
    setFullscreen,
    reset,
  } = usePlayerStore()

  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const src = videoUrl ?? DEMO_SRC

  // HLS setup
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const isHLS = src.includes('.m3u8')

    if (isHLS) {
      // Dynamically import hls.js
      import('hls.js')
        .then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls({ startLevel: -1, autoStartLoad: true })
            hls.loadSource(src)
            hls.attachMedia(video)
            hlsRef.current = hls
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari)
            video.src = src
          }
        })
        .catch(() => {
          video.src = src
        })
    } else {
      video.src = src
    }

    return () => {
      if (hlsRef.current) {
        const hls = hlsRef.current as { destroy: () => void }
        hls.destroy()
        hlsRef.current = null
      }
    }
  }, [src])

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
    const onEnded = () => {
      if (onNext) onNext()
    }

    video.addEventListener('loadeddata', onLoadedData)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('loadeddata', onLoadedData)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('ended', onEnded)
    }
  }, [setPlaying, setCurrentTime, setDuration, setLoading, saveProgress, reset, onNext])

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
        case ' ':
        case 'k':
          e.preventDefault()
          setPlaying(!isPlaying)
          break
        case 'f':
        case 'F':
          if (document.fullscreenElement) {
            document.exitFullscreen()
            setFullscreen(false)
          } else {
            containerRef.current?.requestFullscreen()
            setFullscreen(true)
          }
          break
        case 'm':
        case 'M':
          setMuted(!isMuted)
          break
        case 'ArrowRight':
          video.currentTime += 10
          break
        case 'ArrowLeft':
          video.currentTime -= 10
          break
        case 'Escape':
          router.back()
          break
        case 'n':
        case 'N':
          if (onNext) onNext()
          break
        case 'p':
        case 'P':
          if (onPrev) onPrev()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isPlaying, isMuted, setPlaying, setMuted, setFullscreen, router, onNext, onPrev])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black"
      onMouseMove={resetHideTimer}
      onClick={() => setPlaying(!isPlaying)}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      <video ref={videoRef} className="h-full w-full object-contain" autoPlay playsInline />

      {/* Episode badge */}
      {episodeInfo && (
        <div className="pointer-events-none absolute left-8 top-16 select-none text-sm text-white/70">
          S{episodeInfo.season} E{episodeInfo.episode} · {episodeInfo.title}
        </div>
      )}

      {/* Skip Intro */}
      {showSkipIntro && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (videoRef.current) videoRef.current.currentTime += 75
            setShowSkipIntro(false)
          }}
          className="absolute bottom-24 right-8 z-10 border-2 border-white px-6 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
        >
          Skip Intro
        </button>
      )}

      <PlayerControls
        videoRef={videoRef}
        content={content}
        onBack={() => router.back()}
        onNext={onNext}
        onPrev={onPrev}
      />
    </div>
  )
}
