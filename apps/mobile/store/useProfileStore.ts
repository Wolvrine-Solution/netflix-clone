import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { NetflixProfile } from '@netflix/types'

interface ProfileStore {
  activeProfile: NetflixProfile | null
  setActiveProfile: (profile: NetflixProfile | null) => void
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
    }),
    {
      name: 'netflix-active-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
