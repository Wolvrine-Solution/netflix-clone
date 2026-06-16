import React from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import SectionHeader from './SectionHeader'
import PosterCard from './PosterCard'
import { spacing } from '../theme'
import type { Title } from '../lib/mockData'

type Props = {
  title: string
  data: Title[]
  cardWidth?: number
  showProgress?: boolean
  onPressItem?: (title: Title) => void
}

function ContentRow({ title, data, cardWidth, showProgress, onPressItem }: Props) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
        renderItem={({ item }) => (
          <PosterCard
            title={item}
            width={cardWidth}
            showProgress={showProgress}
            onPress={onPressItem}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  listContent: { paddingHorizontal: spacing.lg },
})

export default React.memo(ContentRow)
