import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSettingsStore } from '../useSettingsStore'

const STORAGE_KEY = '@netflix_settings'

function resetStore() {
  useSettingsStore.setState({
    autoPlay: true,
    autoPlayPreviews: true,
    wifiOnly: false,
    notifications: true,
    playbackQuality: 'auto',
    downloadQuality: 'standard',
    hydrated: false,
  })
}

describe('useSettingsStore', () => {
  beforeEach(async () => {
    resetStore()
    await AsyncStorage.clear()
  })

  it('has the expected default state', () => {
    const state = useSettingsStore.getState()
    expect(state.autoPlay).toBe(true)
    expect(state.autoPlayPreviews).toBe(true)
    expect(state.wifiOnly).toBe(false)
    expect(state.notifications).toBe(true)
    expect(state.playbackQuality).toBe('auto')
    expect(state.downloadQuality).toBe('standard')
    expect(state.hydrated).toBe(false)
  })

  it('setAutoPlay updates state synchronously', () => {
    useSettingsStore.getState().setAutoPlay(false)
    expect(useSettingsStore.getState().autoPlay).toBe(false)
  })

  it('setWifiOnly updates state synchronously', () => {
    useSettingsStore.getState().setWifiOnly(true)
    expect(useSettingsStore.getState().wifiOnly).toBe(true)
  })

  it('setPlaybackQuality updates state to the given quality', () => {
    useSettingsStore.getState().setPlaybackQuality('720p')
    expect(useSettingsStore.getState().playbackQuality).toBe('720p')
  })

  it('setDownloadQuality updates state to the given quality', () => {
    useSettingsStore.getState().setDownloadQuality('high')
    expect(useSettingsStore.getState().downloadQuality).toBe('high')
  })

  it('persists a setter change to AsyncStorage (round trip)', async () => {
    useSettingsStore.getState().setNotifications(false)
    // persist() is fire-and-forget inside the setter; flush microtasks/timers
    await new Promise((resolve) => setTimeout(resolve, 0))

    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const saved = JSON.parse(raw as string)
    expect(saved.notifications).toBe(false)
  })

  it('merges successive persisted writes rather than overwriting unrelated keys', async () => {
    useSettingsStore.getState().setAutoPlay(false)
    await new Promise((resolve) => setTimeout(resolve, 0))
    useSettingsStore.getState().setWifiOnly(true)
    await new Promise((resolve) => setTimeout(resolve, 0))

    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    const saved = JSON.parse(raw as string)
    expect(saved.autoPlay).toBe(false)
    expect(saved.wifiOnly).toBe(true)
  })

  it('hydrate loads persisted settings from AsyncStorage and sets hydrated=true', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ autoPlay: false, playbackQuality: '480p' })
    )

    await useSettingsStore.getState().hydrate()

    const state = useSettingsStore.getState()
    expect(state.hydrated).toBe(true)
    expect(state.autoPlay).toBe(false)
    expect(state.playbackQuality).toBe('480p')
  })

  it('hydrate sets hydrated=true even when there is nothing stored', async () => {
    await useSettingsStore.getState().hydrate()
    const state = useSettingsStore.getState()
    expect(state.hydrated).toBe(true)
    // defaults untouched
    expect(state.autoPlay).toBe(true)
  })

  it('hydrate falls back to defaults (does not throw) when AsyncStorage.getItem rejects', async () => {
    const getItemSpy = jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('storage unavailable'))

    await expect(useSettingsStore.getState().hydrate()).resolves.toBeUndefined()

    const state = useSettingsStore.getState()
    // Falls back to defaults already in memory, but still marks hydrated
    expect(state.hydrated).toBe(true)
    expect(state.autoPlay).toBe(true)
    expect(state.playbackQuality).toBe('auto')

    getItemSpy.mockRestore()
  })

  it('hydrate falls back gracefully when stored JSON is corrupt', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not valid json{{{')

    await expect(useSettingsStore.getState().hydrate()).resolves.toBeUndefined()

    const state = useSettingsStore.getState()
    expect(state.hydrated).toBe(true)
    // defaults preserved since parse failed
    expect(state.autoPlay).toBe(true)
  })

  it('setter persist does not throw and state still updates when AsyncStorage.setItem rejects', async () => {
    const setItemSpy = jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('disk full'))

    expect(() => useSettingsStore.getState().setAutoPlayPreviews(false)).not.toThrow()
    expect(useSettingsStore.getState().autoPlayPreviews).toBe(false)

    // allow the rejected persist() promise to settle without an unhandled rejection
    await new Promise((resolve) => setTimeout(resolve, 0))

    setItemSpy.mockRestore()
  })
})
