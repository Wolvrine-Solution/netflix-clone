import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useProfileStore } from '../store/useProfileStore'
import type { ContentItem } from '@netflix/types'

export function useMyList() {
  const profileId = useProfileStore((s) => s.activeProfile?.id)
  const queryClient = useQueryClient()
  const key = ['my-list', profileId]

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api.myList.get(profileId!).then((r) => r.data.data),
    enabled: !!profileId,
  })

  const addMutation = useMutation({
    mutationFn: (contentId: string) => api.myList.add(profileId!, contentId),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<ContentItem[]>(key)
      return { prev }
    },
    onError: (_err, _contentId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const removeMutation = useMutation({
    mutationFn: (contentId: string) => api.myList.remove(profileId!, contentId),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<ContentItem[]>(key)
      queryClient.setQueryData<ContentItem[]>(key, (old) => old?.filter((c) => c.id !== contentId) ?? [])
      return { prev }
    },
    onError: (_err, _contentId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const isInList = (contentId: string) => data?.some((c) => c.id === contentId) ?? false

  return {
    myList: data ?? [],
    isLoading,
    addToList: addMutation.mutate,
    removeFromList: removeMutation.mutate,
    isInList,
  }
}
