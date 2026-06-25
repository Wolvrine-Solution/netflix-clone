import AsyncStorage from '@react-native-async-storage/async-storage'
import { useProfileStore } from '../useProfileStore'
import type { NetflixProfile } from '@netflix/types'

const profile: NetflixProfile = {
  id: 'p1',
  name: 'Alex',
  avatarUrl: 'https://example.com/avatar.png',
  isKid: false,
} as NetflixProfile

const STORAGE_KEY = 'netflix-active-profile'

describe('useProfileStore', () => {
  beforeEach(async () => {
    useProfileStore.setState({ activeProfile: null })
    await AsyncStorage.clear()
  })

  it('defaults to no active profile', () => {
    expect(useProfileStore.getState().activeProfile).toBeNull()
  })

  it('setActiveProfile updates the active profile in memory', () => {
    useProfileStore.getState().setActiveProfile(profile)
    expect(useProfileStore.getState().activeProfile).toEqual(profile)
  })

  it('setActiveProfile(null) clears the active profile', () => {
    useProfileStore.getState().setActiveProfile(profile)
    useProfileStore.getState().setActiveProfile(null)
    expect(useProfileStore.getState().activeProfile).toBeNull()
  })

  it('persists the active profile to AsyncStorage via zustand persist middleware', async () => {
    useProfileStore.getState().setActiveProfile(profile)

    // zustand persist writes asynchronously; flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0))

    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.activeProfile).toEqual(profile)
  })

  it('rehydrates the active profile from AsyncStorage on persist().rehydrate()', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { activeProfile: profile }, version: 0 })
    )

    await useProfileStore.persist.rehydrate()

    expect(useProfileStore.getState().activeProfile).toEqual(profile)
  })
})
