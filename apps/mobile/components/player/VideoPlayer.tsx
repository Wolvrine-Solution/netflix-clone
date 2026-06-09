import { useRef, useState, useCallback } from 'react'
import { View, TouchableWithoutFeedback, Text, TouchableOpacity } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useWatchProgress } from '../../hooks/useWatchProgress'
import { PlayerControls } from './PlayerControls'
import { Colors } from '../../constants/colors'
import type { ContentItem } from '@netflix/types'

const DEMO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

interface VideoPlayerProps {
  content: ContentItem
  videoUrl?: string
  episodeInfo?: { season: number; episode: number; title: string } | null
  onBack: () => void
  onNext?: () => void
  onPrev?: () => void
  onShowEpisodes?: () => void
}

export function VideoPlayer({ content, videoUrl, episodeInfo, onBack, onNext, onPrev, onShowEpisodes }: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true)
  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { setPlaying, setCurrentTime, setDuration, setLoading, isMuted, isPlaying } = usePlayerStore()
  const { saveProgress, flushProgress } = useWatchProgress(content.id)

  const src = videoUrl ?? DEMO_SRC

  const player = useVideoPlayer(src, (p) => {
    p.loop = false
    p.muted = isMuted
    p.play()
  })

  player.addListener('timeUpdate', (event) => {
    const time = event.currentTime
    setCurrentTime(time)
    saveProgress(time / (player.duration || 1))
    setShowSkipIntro(time >= 15 && time <= 90)
  })

  player.addListener('statusChange', (event) => {
    setLoading(event.status === 'loading')
    setPlaying(event.status === 'readyToPlay' && !player.paused)
    if (event.status === 'readyToPlay') setDuration(player.duration ?? 0)
    if (event.status === 'idle' && onNext) onNext()
  })

  const handleTap = useCallback(() => {
    setShowControls(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  function handleSeek(time: number) {
    player.currentTime = time
    setCurrentTime(time)
  }

  async function handleBack() {
    await flushProgress(player.currentTime / (player.duration || 1))
    player.pause()
    onBack()
  }

  const subtitleText = episodeInfo
    ? `S${episodeInfo.season}:E${episodeInfo.episode} — ${episodeInfo.title}`
    : null

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={{ flex: 1, backgroundColor: Colors.black }}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={false}
        />

        {/* Episode info badge */}
        {subtitleText && showControls && (
          <View style={{ position: 'absolute', top: 48, left: 72 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{subtitleText}</Text>
          </View>
        )}

        {showControls && (
          <>
            <PlayerControls
              title={content.title}
              onBack={handleBack}
              onSeek={handleSeek}
              onNext={onNext}
              onPrev={onPrev}
            />
            {/* Episodes button */}
            {onShowEpisodes && (
              <TouchableOpacity
                onPress={onShowEpisodes}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: Colors.white, fontSize: 13, fontWeight: '600' }}>≡ Episodes</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Skip Intro */}
        {showSkipIntro && showControls && (
          <TouchableOpacity
            style={{
              position: 'absolute', bottom: 80, right: 24,
              borderWidth: 2, borderColor: Colors.white,
              paddingHorizontal: 16, paddingVertical: 8,
              backgroundColor: Colors.overlay,
            }}
            onPress={() => { player.currentTime = 91; setShowSkipIntro(false) }}
          >
            <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 14 }}>Skip Intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}
