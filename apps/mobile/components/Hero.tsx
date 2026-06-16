import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { colors, typography, spacing, radii, shadows } from '../theme'
import type { Title } from '../lib/mockData'

const { width } = Dimensions.get('window')
const HERO_HEIGHT = Math.round(width * (9 / 16)) + 80

interface HeroProps {
  content: Title
  onPlay?: () => void
  onInfo?: () => void
  onList?: () => void
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function HeroButton({
  label,
  icon,
  onPress,
  primary,
}: {
  label: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  onPress?: () => void
  primary?: boolean
}) {
  const scale = useSharedValue(1)
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.94, { damping: 15 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
      onPress={onPress}
      style={[aStyle, primary ? styles.btnPrimary : styles.btnSecondary]}
    >
      <Ionicons name={icon} size={16} color={primary ? colors.black : colors.text} />
      <Text style={[styles.btnLabel, { color: primary ? colors.black : colors.text }]}>{label}</Text>
    </AnimatedPressable>
  )
}

export function Hero({ content, onPlay, onInfo, onList }: HeroProps) {
  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      <Image
        source={{ uri: content.backdrop }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />
      {/* Bottom gradient scrim */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,11,0.55)', colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Left gradient scrim */}
      <LinearGradient
        colors={['rgba(10,10,11,0.6)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.info}>
        {/* Genre chips */}
        <View style={styles.chips}>
          {content.genres.slice(0, 3).map((g, i) => (
            <View key={g} style={styles.chip}>
              {i > 0 && <View style={styles.chipDot} />}
              <Text style={styles.chipText}>{g}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title} numberOfLines={2}>{content.title}</Text>
        <Text style={styles.meta}>{content.year} · {content.rating} · {content.meta}</Text>

        <View style={styles.buttons}>
          <HeroButton label="Play" icon="play" onPress={onPlay} primary />
          <HeroButton label="My List" icon="add" onPress={onList} />
          <HeroButton label="Info" icon="information-circle-outline" onPress={onInfo} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  info: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 0,
  },
  chip: { flexDirection: 'row', alignItems: 'center' },
  chipDot: {
    width: 3,
    height: 3,
    borderRadius: 9,
    backgroundColor: colors.textMuted,
    marginHorizontal: spacing.sm,
  },
  chipText: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...typography.display,
    color: colors.text,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    ...shadows.card,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  btnLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
})
