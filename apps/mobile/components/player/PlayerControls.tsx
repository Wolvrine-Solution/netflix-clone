import { View, Text, TouchableOpacity, Dimensions } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { Colors } from '../../constants/colors'

const { width } = Dimensions.get('window')

interface PlayerControlsProps {
  title: string
  onBack: () => void
  onSeek: (time: number) => void
  onNext?: () => void
  onPrev?: () => void
  onQuality?: () => void
  onFullscreen?: () => void
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PlayerControls({
  title,
  onBack,
  onSeek,
  onNext,
  onPrev,
  onQuality,
  onFullscreen,
}: PlayerControlsProps) {
  const { isPlaying, currentTime, duration, isMuted, isFullscreen, setPlaying, setMuted } =
    usePlayerStore()
  const { playbackQuality } = useSettingsStore()

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{ position: 'absolute', inset: 0 }}
      pointerEvents="box-none"
    >
      {/* Top gradient + back button + quality/fullscreen */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 80,
          paddingTop: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
        >
          <Text style={{ color: Colors.white, fontSize: 22 }}>←</Text>
          <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '600' }} numberOfLines={1}>
            {title}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {onQuality && (
            <TouchableOpacity
              onPress={onQuality}
              style={{
                backgroundColor: 'rgba(0,0,0,0.5)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: Colors.white, fontSize: 11, fontWeight: '700' }}>
                {playbackQuality.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}
          {onFullscreen && (
            <TouchableOpacity onPress={onFullscreen} activeOpacity={0.8}>
              <Text style={{ color: Colors.white, fontSize: 20 }}>{isFullscreen ? '⊡' : '⛶'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Center play/pause */}
      <View
        style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}
        pointerEvents="box-none"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
          {onPrev && (
            <TouchableOpacity
              onPress={onPrev}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.4)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.white, fontSize: 18 }}>⏮</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: Colors.overlay,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setPlaying(!isPlaying)}
          >
            <Text style={{ color: Colors.white, fontSize: 28 }}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {onNext && (
            <TouchableOpacity
              onPress={onNext}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'rgba(0,0,0,0.4)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.white, fontSize: 18 }}>⏭</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom gradient + controls */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 24,
          paddingHorizontal: 16,
        }}
      >
        {/* Progress bar */}
        <TouchableOpacity
          style={{
            height: 4,
            backgroundColor: Colors.mediumGray,
            borderRadius: 2,
            marginBottom: 12,
            overflow: 'hidden',
          }}
          onPress={(e) => {
            const x = e.nativeEvent.locationX
            const seekTime = (x / width) * duration
            onSeek(seekTime)
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              backgroundColor: Colors.red,
              borderRadius: 2,
            }}
          />
        </TouchableOpacity>

        {/* Control row */}
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            {/* Skip back 10s */}
            <TouchableOpacity onPress={() => onSeek(Math.max(0, currentTime - 10))}>
              <Text style={{ color: Colors.white, fontSize: 20 }}>⏮</Text>
            </TouchableOpacity>

            {/* Play/pause */}
            <TouchableOpacity onPress={() => setPlaying(!isPlaying)}>
              <Text style={{ color: Colors.white, fontSize: 22 }}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            {/* Skip forward 10s */}
            <TouchableOpacity onPress={() => onSeek(Math.min(duration, currentTime + 10))}>
              <Text style={{ color: Colors.white, fontSize: 20 }}>⏭</Text>
            </TouchableOpacity>

            {/* Mute */}
            <TouchableOpacity onPress={() => setMuted(!isMuted)}>
              <Text style={{ color: Colors.white, fontSize: 20 }}>{isMuted ? '🔇' : '🔊'}</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <Text style={{ color: Colors.lightGray, fontSize: 13 }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}
