import { renderHook, act } from '@testing-library/react-native'
import { useWatchProgress } from '../useWatchProgress'
import { useProfileStore } from '../../store/useProfileStore'
import { api } from '../../lib/api'

jest.mock('../../lib/api', () => ({
  api: {
    history: {
      update: jest.fn().mockResolvedValue({}),
    },
  },
}))

describe('useWatchProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    useProfileStore.setState({ activeProfile: { id: 'profile-1' } as never })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does not call the API when there is no active profile', () => {
    useProfileStore.setState({ activeProfile: null })
    const { result } = renderHook(() => useWatchProgress('content-1'))

    act(() => {
      result.current.saveProgress(0.5)
      jest.advanceTimersByTime(5000)
    })

    expect(api.history.update).not.toHaveBeenCalled()
  })

  it('debounces saveProgress and calls the API after 5s once progress changed enough', () => {
    const { result } = renderHook(() => useWatchProgress('content-1'))

    act(() => {
      result.current.saveProgress(0.5)
    })
    expect(api.history.update).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    expect(api.history.update).toHaveBeenCalledWith('profile-1', 'content-1', 0.5)
  })

  it('ignores saveProgress calls when the change is below the 1% threshold', () => {
    const { result } = renderHook(() => useWatchProgress('content-1'))

    act(() => {
      result.current.saveProgress(0.001)
      jest.advanceTimersByTime(5000)
    })

    expect(api.history.update).not.toHaveBeenCalled()
  })

  it('resets the debounce timer when saveProgress is called again before it fires', () => {
    const { result } = renderHook(() => useWatchProgress('content-1'))

    act(() => {
      result.current.saveProgress(0.3)
      jest.advanceTimersByTime(3000)
      result.current.saveProgress(0.6)
      jest.advanceTimersByTime(3000)
    })
    // Total elapsed since first call is 6s, but the timer was reset at 3s,
    // so only 3s have passed since the last call — should not have fired yet.
    expect(api.history.update).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(api.history.update).toHaveBeenCalledTimes(1)
    expect(api.history.update).toHaveBeenCalledWith('profile-1', 'content-1', 0.6)
  })

  it('flushProgress calls the API immediately without waiting for the debounce', async () => {
    const { result } = renderHook(() => useWatchProgress('content-1'))

    await act(async () => {
      await result.current.flushProgress(0.9)
    })

    expect(api.history.update).toHaveBeenCalledWith('profile-1', 'content-1', 0.9)
  })

  it('flushProgress does nothing when there is no active profile', async () => {
    useProfileStore.setState({ activeProfile: null })
    const { result } = renderHook(() => useWatchProgress('content-1'))

    await act(async () => {
      await result.current.flushProgress(0.9)
    })

    expect(api.history.update).not.toHaveBeenCalled()
  })

  it('does not throw when the API call fails (best-effort save)', () => {
    ;(api.history.update as jest.Mock).mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useWatchProgress('content-1'))

    expect(() => {
      act(() => {
        result.current.saveProgress(0.5)
        jest.advanceTimersByTime(5000)
      })
    }).not.toThrow()
  })
})
