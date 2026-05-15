import { create } from 'zustand'

interface PlayerStore {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  quality: 'auto' | '1080p' | '720p' | '480p' | '360p'
  isFullscreen: boolean
  isLoading: boolean
  showControls: boolean
  setPlaying: (v: boolean) => void
  setMuted: (v: boolean) => void
  setVolume: (v: number) => void
  setCurrentTime: (v: number) => void
  setDuration: (v: number) => void
  setQuality: (v: PlayerStore['quality']) => void
  setFullscreen: (v: boolean) => void
  setLoading: (v: boolean) => void
  setShowControls: (v: boolean) => void
  reset: () => void
}

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

export const usePlayerStore = create<PlayerStore>((set) => ({
  ...defaultState,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setQuality: (quality) => set({ quality }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setLoading: (isLoading) => set({ isLoading }),
  setShowControls: (showControls) => set({ showControls }),
  reset: () => set(defaultState),
}))
