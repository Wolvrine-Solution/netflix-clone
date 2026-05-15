'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useProfileStore } from '@/store/useProfileStore'
import type { ContentItem } from '@netflix/types'

export function useMyList() {
  const { activeProfile } = useProfileStore()
  const queryClient = useQueryClient()
  const profileId = activeProfile?.id

  const { data: myList = [] } = useQuery<ContentItem[]>({
    queryKey: ['my-list', profileId],
    queryFn: async () => {
      if (!profileId) return []
      const res = await api.myList.get(profileId)
      return res.data.data as ContentItem[]
    },
    enabled: !!profileId,
  })

  const isInList = (contentId: string) => myList.some((item) => item.id === contentId)

  const addMutation = useMutation({
    mutationFn: (contentId: string) => api.myList.add(profileId!, contentId),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: ['my-list', profileId] })
      const prev = queryClient.getQueryData<ContentItem[]>(['my-list', profileId])
      queryClient.setQueryData<ContentItem[]>(['my-list', profileId], (old = []) => [
        ...old,
        { id: contentId } as ContentItem,
      ])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['my-list', profileId], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-list', profileId] }),
  })

  const removeMutation = useMutation({
    mutationFn: (contentId: string) => api.myList.remove(profileId!, contentId),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: ['my-list', profileId] })
      const prev = queryClient.getQueryData<ContentItem[]>(['my-list', profileId])
      queryClient.setQueryData<ContentItem[]>(['my-list', profileId], (old = []) =>
        old.filter((item) => item.id !== contentId)
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['my-list', profileId], ctx?.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['my-list', profileId] }),
  })

  const toggle = (contentId: string) => {
    if (isInList(contentId)) removeMutation.mutate(contentId)
    else addMutation.mutate(contentId)
  }

  return { myList, isInList, toggle, isLoading: addMutation.isPending || removeMutation.isPending }
}
