import { create } from 'zustand'
import type { ContentItem } from '@netflix/types'

interface ModalStore {
  isOpen: boolean
  content: ContentItem | null
  openModal: (content: ContentItem) => void
  closeModal: () => void
}

export const useModalStore = create<ModalStore>((set) => ({
  isOpen: false,
  content: null,
  openModal: (content) => set({ isOpen: true, content }),
  closeModal: () => set({ isOpen: false, content: null }),
}))
