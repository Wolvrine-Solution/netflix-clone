import React from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import SectionHeader from './SectionHeader'
import { colors, radii, shadows, spacing, typography } from '../theme'
import type { Title } from '../lib/mockData'

const CARD_W = 130
const CARD_H = CARD_W * 1.5

interface Top10RowProps {
  title: string
  data: Title[]
  onPressItem?: (t: Title) => void
}

function Top10Card({ title, rank, onPress }: { title: Title; rank: number; onPress?: () => void }) {
  const scale = useSharedValue(1)
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  // Rank digit font size scales down for 2+ digits
  const digitSize = rank >= 10 ? 64 : 80

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 14 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
      onPress={onPress}
    >
      <Animated.View style={[styles.item, aStyle]}>
        {/* Big rank number behind the card */}
        <Text style={[styles.rank, { fontSize: digitSize }]}>{rank}</Text>
        {/* Poster */}
        <View style={[styles.card, shadows.card]}>
          <Image
            source={{ uri: title.poster }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
        </View>
      </Animated.View>
    </Pressable>
  )
}

function Top10Row({ title, data, onPressItem }: Top10RowProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} accent />
      <FlatList
        data={data.slice(0, 10)}
        keyExtractor={(t) => t.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
        renderItem={({ item, index }) => (
          <Top10Card title={item} rank={index + 1} onPress={() => onPressItem?.(item)} />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  list: { paddingHorizontal: spacing.lg },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: CARD_W + 44,
  },
  rank: {
    fontWeight: '900',
    color: colors.surfaceElevated,
    // Stroke effect via text shadow layers
    textShadowColor: colors.textFaint,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
    lineHeight: CARD_H * 0.9,
    marginRight: -12,
    zIndex: 0,
    letterSpacing: -4,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    zIndex: 1,
  },
})

export default React.memo(Top10Row)
