import { useRef, useCallback } from 'react'
import { api } from '../lib/api'
import { useProfileStore } from '../store/useProfileStore'

export function useWatchProgress(contentId: string) {
  const profileId = useProfileStore((s) => s.activeProfile?.id)
  const lastSavedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveProgress = useCallback(
    (progress: number) => {
      if (!profileId) return
      // Only save if progress changed by more than 1% and at least 5s since last save
      if (Math.abs(progress - lastSavedRef.current) < 0.01) return

      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(async () => {
        try {
          await api.history.update(profileId, contentId, progress)
          lastSavedRef.current = progress
        } catch {
          // silently fail — progress save is best effort
        }
      }, 5000)
    },
    [profileId, contentId]
  )

  const flushProgress = useCallback(
    async (progress: number) => {
      if (!profileId) return
      if (timerRef.current) clearTimeout(timerRef.current)
      try {
        await api.history.update(profileId, contentId, progress)
        lastSavedRef.current = progress
      } catch {
        // best effort
      }
    },
    [profileId, contentId]
  )

  return { saveProgress, flushProgress }
}
