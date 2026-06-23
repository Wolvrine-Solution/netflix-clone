import { TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { useModalStore } from '../../store/useModalStore'
import { getPosterUrl } from '../../lib/utils'
import type { ContentItem } from '@netflix/types'

interface ContentCardProps {
  content: ContentItem
}

export function ContentCard({ content }: ContentCardProps) {
  const openModal = useModalStore((s) => s.openModal)

  return (
    <TouchableOpacity onPress={() => openModal(content)} activeOpacity={0.8}>
      <View style={{ aspectRatio: 2 / 3 }}>
        <Image
          source={{ uri: getPosterUrl(content.posterPath) }}
          style={{ flex: 1, borderRadius: 4 }}
          contentFit="cover"
          transition={200}
        />
      </View>
    </TouchableOpacity>
  )
}
