import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Quality = 'auto' | '1080p' | '720p' | '480p' | '360p'
type DownloadQuality = 'standard' | 'high'

interface SettingsStore {
  autoPlay: boolean
  autoPlayPreviews: boolean
  wifiOnly: boolean
  notifications: boolean
  playbackQuality: Quality
  downloadQuality: DownloadQuality
  hydrated: boolean
  setAutoPlay: (v: boolean) => void
  setAutoPlayPreviews: (v: boolean) => void
  setWifiOnly: (v: boolean) => void
  setNotifications: (v: boolean) => void
  setPlaybackQuality: (v: Quality) => void
  setDownloadQuality: (v: DownloadQuality) => void
  hydrate: () => Promise<void>
}

const STORAGE_KEY = '@netflix_settings'

async function persist(patch: Partial<SettingsStore>) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const prev = raw ? JSON.parse(raw) : {}
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch {}
}

function setter<K extends keyof SettingsStore>(
  key: K,
  set: (fn: (s: SettingsStore) => Partial<SettingsStore>) => void
) {
  return (value: SettingsStore[K]) => {
    set(() => ({ [key]: value }) as Partial<SettingsStore>)
    persist({ [key]: value })
  }
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  autoPlay: true,
  autoPlayPreviews: true,
  wifiOnly: false,
  notifications: true,
  playbackQuality: 'auto',
  downloadQuality: 'standard',
  hydrated: false,

  setAutoPlay: setter('autoPlay', set),
  setAutoPlayPreviews: setter('autoPlayPreviews', set),
  setWifiOnly: setter('wifiOnly', set),
  setNotifications: setter('notifications', set),
  setPlaybackQuality: setter('playbackQuality', set),
  setDownloadQuality: setter('downloadQuality', set),

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        set({ ...saved, hydrated: true })
      } else {
        set({ hydrated: true })
      }
    } catch {
      set({ hydrated: true })
    }
  },
}))
