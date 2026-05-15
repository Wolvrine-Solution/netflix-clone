import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import * as ScreenOrientation from 'expo-screen-orientation'
import { api } from '../../../lib/api'
import { VideoPlayer } from '../../../components/player/VideoPlayer'
import { Colors } from '../../../constants/colors'

export default function WatchScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>()

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => api.content(contentId!).then((r) => r.data.data),
    enabled: !!contentId,
  })

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    }
  }, [])

  if (isLoading || !content) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.black, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.red} />
      </View>
    )
  }

  return <VideoPlayer content={content} onBack={() => router.back()} />
}
