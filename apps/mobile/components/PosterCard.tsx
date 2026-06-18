import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { colors, radii, shadows, spacing, typography } from '../theme'
import type { Title } from '../lib/mockData'

type Props = {
  title: Title
  width?: number
  /** Show a thin progress bar at the bottom (Continue Watching). */
  showProgress?: boolean
  onPress?: (title: Title) => void
}

const DEFAULT_WIDTH = 124

function PosterCard({ title, width = DEFAULT_WIDTH, showProgress, onPress }: Props) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const height = width * 1.5

  return (
    <Pressable
      onPressIn={() => (scale.value = withSpring(0.94, { damping: 14, stiffness: 220 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 14, stiffness: 220 }))}
      onPress={() => onPress?.(title)}
      accessibilityRole="button"
      accessibilityLabel={title.title}
    >
      <Animated.View style={[styles.card, { width, height }, shadows.card, animatedStyle]}>
        <Image
          source={{ uri: title.poster }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
        {title.isNew ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        ) : null}

        {showProgress && typeof title.progress === 'number' ? (
          <View style={styles.bottom}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.scrim}
            />
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${title.progress}%` }]} />
            </View>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.red,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  badgeText: { ...typography.label, color: colors.white },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 48 },
  progressTrack: {
    height: 3,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.red, borderRadius: radii.pill },
})

export default React.memo(PosterCard)
