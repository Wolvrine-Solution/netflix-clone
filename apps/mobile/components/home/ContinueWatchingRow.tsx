import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '../../lib/api'
import { Colors } from '../../constants/colors'

interface WatchItem {
  id: string
  progress: number
  content: {
    id: string
    title: string
    posterPath: string
    backdropPath: string
    runtime?: number | null
    mediaType: string
  }
}

interface Props {
  profileId: string
}

export function ContinueWatchingRow({ profileId }: Props) {
  const { data } = useQuery({
    queryKey: ['history', profileId],
    queryFn: () =>
      api.history.get(profileId).then((r) => {
        const items = (r.data.data ?? []) as WatchItem[]
        return items.filter((w) => w.progress > 0.02 && w.progress < 0.97).slice(0, 10)
      }),
    enabled: !!profileId,
    staleTime: 1000 * 60 * 2,
  })

  if (!data || data.length === 0) return null

  return (
    <View style={{ paddingVertical: 12 }}>
      <Text
        style={{
          color: Colors.white,
          fontSize: 16,
          fontWeight: '700',
          paddingHorizontal: 12,
          marginBottom: 10,
        }}
      >
        Continue Watching
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
      >
        {data.map((item) => {
          const pct = item.progress * 100
          const remaining = item.content.runtime
            ? Math.round(item.content.runtime * (1 - item.progress))
            : null

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/(main)/watch/${item.content.id}`)}
              style={{ width: 160 }}
              activeOpacity={0.8}
            >
              {/* Thumbnail */}
              <View
                style={{
                  width: 160,
                  height: 90,
                  borderRadius: 6,
                  overflow: 'hidden',
                  backgroundColor: Colors.darkGray,
                }}
              >
                <Image
                  source={{ uri: item.content.backdropPath || item.content.posterPath }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {/* Overlay */}
                <View
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                />
                {/* Progress bar */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: Colors.red }} />
                </View>
              </View>

              <View style={{ paddingTop: 6 }}>
                <Text
                  style={{ color: Colors.white, fontSize: 12, fontWeight: '600' }}
                  numberOfLines={1}
                >
                  {item.content.title}
                </Text>
                {remaining !== null && (
                  <Text style={{ color: Colors.lightGray, fontSize: 11, marginTop: 2 }}>
                    {remaining}m left
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}
