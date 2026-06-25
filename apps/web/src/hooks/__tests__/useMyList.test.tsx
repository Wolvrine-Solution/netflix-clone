import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMyList } from '@/hooks/useMyList'
import { api } from '@/lib/api'
import { useProfileStore } from '@/store/useProfileStore'
import type { ContentItem } from '@netflix/types'

vi.mock('@/lib/api', () => ({
  api: {
    myList: {
      get: vi.fn(),
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
}))

const mockedApi = api as unknown as {
  myList: {
    get: ReturnType<typeof vi.fn>
    add: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
  }
}

const profile = {
  id: 'profile-1',
  name: 'Main',
  avatarUrl: '/a.png',
  isKid: false,
  language: 'en',
  userId: 'user-1',
}

const existingItem = { id: 'content-1', title: 'Existing Show' } as unknown as ContentItem

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  }
}

describe('useMyList', () => {
  beforeEach(() => {
    useProfileStore.setState({ activeProfile: profile })
    mockedApi.myList.get.mockResolvedValue({ data: { data: [existingItem] } })
  })

  afterEach(() => {
    vi.clearAllMocks()
    useProfileStore.setState({ activeProfile: null })
  })

  it('loads the my-list from the API for the active profile', async () => {
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMyList(), { wrapper })

    await waitFor(() => expect(result.current.myList).toHaveLength(1))
    expect(mockedApi.myList.get).toHaveBeenCalledWith('profile-1')
    expect(result.current.isInList('content-1')).toBe(true)
    expect(result.current.isInList('content-2')).toBe(false)
  })

  it('optimistically adds an item before the API call resolves, then keeps it after success', async () => {
    let resolveAdd!: (value: unknown) => void
    mockedApi.myList.add.mockImplementation(
      () => new Promise((resolve) => (resolveAdd = resolve))
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMyList(), { wrapper })

    await waitFor(() => expect(result.current.myList).toHaveLength(1))

    act(() => {
      result.current.toggle('content-2')
    })

    // Optimistic update should be visible immediately, before the mutation resolves.
    await waitFor(() => expect(result.current.isInList('content-2')).toBe(true))
    expect(mockedApi.myList.add).toHaveBeenCalledWith('profile-1', 'content-2')

    // Once the server confirms the add, a follow-up refetch should reflect it too.
    const addedItem = { id: 'content-2', title: 'New Show' } as unknown as ContentItem
    mockedApi.myList.get.mockResolvedValue({ data: { data: [existingItem, addedItem] } })

    act(() => resolveAdd({ data: {} }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isInList('content-2')).toBe(true)
  })

  it('rolls back the optimistic add when the API call fails', async () => {
    let rejectAdd!: (err: unknown) => void
    mockedApi.myList.add.mockImplementation(
      () => new Promise((_resolve, reject) => (rejectAdd = reject))
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMyList(), { wrapper })

    await waitFor(() => expect(result.current.myList).toHaveLength(1))

    act(() => {
      result.current.toggle('content-2')
    })

    // Optimistic state shows the item added right away, before the request settles.
    await waitFor(() => expect(result.current.isInList('content-2')).toBe(true))

    act(() => rejectAdd(new Error('network error')))

    // Once the mutation settles (and fails), it should roll back to the server state.
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isInList('content-2')).toBe(false)
    expect(result.current.myList).toHaveLength(1)
  })

  it('optimistically removes an item already in the list, and rolls back on failure', async () => {
    let rejectRemove!: (err: unknown) => void
    mockedApi.myList.remove.mockImplementation(
      () => new Promise((_resolve, reject) => (rejectRemove = reject))
    )

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMyList(), { wrapper })

    await waitFor(() => expect(result.current.myList).toHaveLength(1))
    expect(result.current.isInList('content-1')).toBe(true)

    act(() => {
      result.current.toggle('content-1')
    })

    // Optimistically removed immediately, before the request settles.
    await waitFor(() => expect(result.current.isInList('content-1')).toBe(false))
    expect(mockedApi.myList.remove).toHaveBeenCalledWith('profile-1', 'content-1')

    act(() => rejectRemove(new Error('network error')))

    // Rolled back after the failed request settles.
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isInList('content-1')).toBe(true)
  })

  it('removes an item and keeps it removed when the API call succeeds', async () => {
    mockedApi.myList.remove.mockImplementation(async () => {
      // Simulate the server now reflecting the removal on the next refetch.
      mockedApi.myList.get.mockResolvedValue({ data: { data: [] } })
      return { data: {} }
    })

    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useMyList(), { wrapper })

    await waitFor(() => expect(result.current.myList).toHaveLength(1))

    act(() => {
      result.current.toggle('content-1')
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isInList('content-1')).toBe(false)
  })
})
