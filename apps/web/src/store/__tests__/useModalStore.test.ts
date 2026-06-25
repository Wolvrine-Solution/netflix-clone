import { describe, it, expect, beforeEach } from 'vitest'
import { useModalStore } from '@/store/useModalStore'
import type { ContentItem } from '@netflix/types'

const sampleContent = { id: 'movie-1', title: 'Sample Movie' } as unknown as ContentItem

describe('useModalStore', () => {
  beforeEach(() => {
    useModalStore.setState({ isOpen: false, content: null })
  })

  it('starts closed with no content', () => {
    const state = useModalStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.content).toBeNull()
  })

  it('openModal sets isOpen true and stores the content', () => {
    useModalStore.getState().openModal(sampleContent)
    const state = useModalStore.getState()
    expect(state.isOpen).toBe(true)
    expect(state.content).toBe(sampleContent)
  })

  it('closeModal resets isOpen and clears content', () => {
    useModalStore.getState().openModal(sampleContent)
    useModalStore.getState().closeModal()
    const state = useModalStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.content).toBeNull()
  })

  it('opening a second item while open replaces the previous content', () => {
    const other = { id: 'movie-2', title: 'Other Movie' } as unknown as ContentItem
    useModalStore.getState().openModal(sampleContent)
    useModalStore.getState().openModal(other)
    expect(useModalStore.getState().content).toBe(other)
    expect(useModalStore.getState().isOpen).toBe(true)
  })
})
