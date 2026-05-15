'use client'
import { useRef, useCallback } from 'react'
import { api } from '@/lib/api'
import { useProfileStore } from '@/store/useProfileStore'

export function useWatchProgress(contentId: string) {
  const { activeProfile } = useProfileStore()
  const lastSavedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveProgress = useCallback(
    (progress: number) => {
      if (!activeProfile) return
      if (Math.abs(progress - lastSavedRef.current) < 0.01) return

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        try {
          await api.history.update(activeProfile.id, contentId, progress)
          lastSavedRef.current = progress
        } catch {
          // silent fail — progress save is best-effort
        }
      }, 5000)
    },
    [activeProfile, contentId]
  )

  return { saveProgress }
}
