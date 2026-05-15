export type PlayerQuality = 'auto' | '1080p' | '720p' | '480p' | '360p'

export interface PlayerState {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  quality: PlayerQuality
  isFullscreen: boolean
  isLoading: boolean
  showControls: boolean
}

export interface SubtitleTrack {
  id: string
  language: string
  label: string
  src: string
}
