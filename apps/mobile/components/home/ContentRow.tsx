import { View, Text, FlatList } from 'react-native'
import { ContentCard } from './ContentCard'
import { Colors } from '../../constants/colors'
import type { ContentItem } from '@netflix/types'

interface ContentRowProps {
  title: string
  items: ContentItem[]
}

export function ContentRow({ title, items }: ContentRowProps) {
  if (items.length === 0) return null

  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          color: Colors.white,
          fontSize: 16,
          fontWeight: '700',
          marginBottom: 8,
          paddingHorizontal: 16,
        }}
      >
        {title}
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        renderItem={({ item }) => (
          <View style={{ width: 120 }}>
            <ContentCard content={item} />
          </View>
        )}
      />
    </View>
  )
}
