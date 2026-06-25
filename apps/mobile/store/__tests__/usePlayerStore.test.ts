import { usePlayerStore } from '../usePlayerStore'

const defaultState = {
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  quality: 'auto' as const,
  isFullscreen: false,
  isLoading: true,
  showControls: true,
}

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState(defaultState)
  })

  it('has the expected default state', () => {
    const state = usePlayerStore.getState()
    expect(state).toMatchObject(defaultState)
  })

  it('setPlaying toggles isPlaying', () => {
    usePlayerStore.getState().setPlaying(true)
    expect(usePlayerStore.getState().isPlaying).toBe(true)
    usePlayerStore.getState().setPlaying(false)
    expect(usePlayerStore.getState().isPlaying).toBe(false)
  })

  it('setMuted toggles isMuted', () => {
    usePlayerStore.getState().setMuted(true)
    expect(usePlayerStore.getState().isMuted).toBe(true)
  })

  it('setVolume updates volume to the given value', () => {
    usePlayerStore.getState().setVolume(0.5)
    expect(usePlayerStore.getState().volume).toBe(0.5)
  })

  it('setCurrentTime and setDuration update independently', () => {
    usePlayerStore.getState().setCurrentTime(42)
    usePlayerStore.getState().setDuration(120)
    const state = usePlayerStore.getState()
    expect(state.currentTime).toBe(42)
    expect(state.duration).toBe(120)
  })

  it('setQuality updates the quality field', () => {
    usePlayerStore.getState().setQuality('1080p')
    expect(usePlayerStore.getState().quality).toBe('1080p')
  })

  it('setFullscreen toggles isFullscreen', () => {
    usePlayerStore.getState().setFullscreen(true)
    expect(usePlayerStore.getState().isFullscreen).toBe(true)
  })

  it('setLoading toggles isLoading', () => {
    usePlayerStore.getState().setLoading(false)
    expect(usePlayerStore.getState().isLoading).toBe(false)
  })

  it('setShowControls toggles showControls', () => {
    usePlayerStore.getState().setShowControls(false)
    expect(usePlayerStore.getState().showControls).toBe(false)
  })

  it('reset restores all fields to their default values after mutation', () => {
    usePlayerStore.setState({
      isPlaying: true,
      isMuted: true,
      volume: 0.2,
      currentTime: 99,
      duration: 200,
      quality: '480p',
      isFullscreen: true,
      isLoading: false,
      showControls: false,
    })

    usePlayerStore.getState().reset()

    expect(usePlayerStore.getState()).toMatchObject(defaultState)
  })
})
