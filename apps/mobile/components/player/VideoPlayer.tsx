import { useRef, useState, useCallback } from 'react'
import { View, TouchableWithoutFeedback, Text, TouchableOpacity } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useWatchProgress } from '../../hooks/useWatchProgress'
import { PlayerControls } from './PlayerControls'
import { Colors } from '../../constants/colors'
import type { ContentItem } from '@netflix/types'

// Demo source — replace with real HLS stream
const DEMO_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

interface VideoPlayerProps {
  content: ContentItem
  onBack: () => void
}

export function VideoPlayer({ content, onBack }: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(true)
  const [showSkipIntro, setShowSkipIntro] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { setPlaying, setCurrentTime, setDuration, setLoading, isMuted, isPlaying } = usePlayerStore()
  const { saveProgress, flushProgress } = useWatchProgress(content.id)

  const player = useVideoPlayer(DEMO_SRC, (p) => {
    p.loop = false
    p.muted = isMuted
    p.play()
  })

  // Track time updates
  player.addListener('timeUpdate', (event) => {
    const time = event.currentTime
    setCurrentTime(time)
    saveProgress(time / (player.duration || 1))
    // Show skip intro between 15–90 seconds
    setShowSkipIntro(time >= 15 && time <= 90)
  })

  player.addListener('statusChange', (event) => {
    setLoading(event.status === 'loading')
    setPlaying(event.status === 'readyToPlay' && !player.paused)
    if (event.status === 'readyToPlay') {
      setDuration(player.duration ?? 0)
    }
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

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={{ flex: 1, backgroundColor: Colors.black }}>
        <VideoView
          player={player}
          style={{ flex: 1 }}
          contentFit="contain"
          nativeControls={false}
        />

        {showControls && (
          <PlayerControls title={content.title} onBack={handleBack} onSeek={handleSeek} />
        )}

        {/* Skip Intro */}
        {showSkipIntro && showControls && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 80,
              right: 24,
              borderWidth: 2,
              borderColor: Colors.white,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: Colors.overlay,
            }}
            onPress={() => {
              player.currentTime = 91
              setShowSkipIntro(false)
            }}
          >
            <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 14 }}>Skip Intro</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}
