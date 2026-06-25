import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '@/store/usePlayerStore'

const defaultState = {
  isPlaying: false,
  isMuted: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  quality: 'auto',
  isFullscreen: false,
  isLoading: true,
  showControls: true,
}

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState(defaultState)
  })

  it('initializes with the expected default state', () => {
    expect(usePlayerStore.getState()).toMatchObject(defaultState)
  })

  it('setPlaying toggles isPlaying without touching other fields', () => {
    usePlayerStore.getState().setPlaying(true)
    const state = usePlayerStore.getState()
    expect(state.isPlaying).toBe(true)
    expect(state.volume).toBe(0.8)
  })

  it('setVolume, setCurrentTime, and setDuration update independently', () => {
    usePlayerStore.getState().setVolume(0.3)
    usePlayerStore.getState().setCurrentTime(42)
    usePlayerStore.getState().setDuration(120)
    const state = usePlayerStore.getState()
    expect(state.volume).toBe(0.3)
    expect(state.currentTime).toBe(42)
    expect(state.duration).toBe(120)
  })

  it('setQuality updates the playback quality', () => {
    usePlayerStore.getState().setQuality('1080p')
    expect(usePlayerStore.getState().quality).toBe('1080p')
  })

  it('reset restores every field back to the default state after mutation', () => {
    const { setPlaying, setMuted, setVolume, setCurrentTime, setDuration, setFullscreen, reset } =
      usePlayerStore.getState()
    setPlaying(true)
    setMuted(true)
    setVolume(0.1)
    setCurrentTime(99)
    setDuration(200)
    setFullscreen(true)

    reset()

    expect(usePlayerStore.getState()).toMatchObject(defaultState)
  })
})
