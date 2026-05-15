import { create } from 'zustand'
import type { PlayerState, PlayerQuality } from '@netflix/types'

interface PlayerStore extends PlayerState {
  setPlaying: (isPlaying: boolean) => void
  setMuted: (isMuted: boolean) => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setQuality: (quality: PlayerQuality) => void
  setFullscreen: (isFullscreen: boolean) => void
  setLoading: (isLoading: boolean) => void
  setShowControls: (show: boolean) => void
  reset: () => void
}

const defaultState: PlayerState = {
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
