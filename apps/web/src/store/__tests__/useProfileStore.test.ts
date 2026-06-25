import { describe, it, expect, beforeEach } from 'vitest'
import { useProfileStore } from '@/store/useProfileStore'
import type { NetflixProfile } from '@netflix/types'

const profile: NetflixProfile = {
  id: 'profile-1',
  name: 'Kids',
  avatarUrl: '/avatars/1.png',
  isKid: true,
  language: 'en',
  userId: 'user-1',
}

describe('useProfileStore', () => {
  beforeEach(() => {
    useProfileStore.setState({ activeProfile: null })
    localStorage.clear()
  })

  it('starts with no active profile', () => {
    expect(useProfileStore.getState().activeProfile).toBeNull()
  })

  it('setActiveProfile updates the active profile', () => {
    useProfileStore.getState().setActiveProfile(profile)
    expect(useProfileStore.getState().activeProfile).toEqual(profile)
  })

  it('persists the active profile to localStorage under the netflix-active-profile key', () => {
    useProfileStore.getState().setActiveProfile(profile)
    const raw = localStorage.getItem('netflix-active-profile')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.activeProfile).toEqual(profile)
  })

  it('setActiveProfile(null) clears the active profile (e.g. on profile switch / logout)', () => {
    useProfileStore.getState().setActiveProfile(profile)
    useProfileStore.getState().setActiveProfile(null)
    expect(useProfileStore.getState().activeProfile).toBeNull()
  })
})
