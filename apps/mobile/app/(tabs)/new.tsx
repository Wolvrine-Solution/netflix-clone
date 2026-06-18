import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { newAndHot } from '../../lib/mockData'
import { colors, radii, shadows, spacing, typography } from '../../theme'
import type { Title } from '../../lib/mockData'

function HotCard({ item }: { item: Title }) {
  return (
    <View style={styles.card}>
      {/* Backdrop */}
      <View style={styles.backdrop}>
        <Image source={{ uri: item.backdrop }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        <LinearGradient
          colors={['transparent', colors.background]}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Month badge */}
        <View style={styles.monthBadge}>
          <Ionicons name="flame" size={14} color={colors.red} />
          <Text style={styles.monthText}>NEW</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.meta}>{item.year} · {item.rating} · {item.meta}</Text>
        <Text style={styles.overview} numberOfLines={3}>{item.overview}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.reminderBtn}>
            <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.reminderText}>My List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.playBtn}>
            <Ionicons name="play" size={16} color={colors.black} />
            <Text style={styles.playText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.reminderBtn}>
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.reminderText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function NewHotScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>New & Hot</Text>
      </View>
      <FlatList
        data={newAndHot}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom, paddingTop: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xl }} />}
        renderItem={({ item }) => <HotCard item={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.title, color: colors.text },
  card: { backgroundColor: colors.background },
  backdrop: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden' },
  monthBadge: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthText: { ...typography.label, color: colors.text, letterSpacing: 1 },
  info: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
  title: { ...typography.heading, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  overview: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  reminderBtn: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  reminderText: { ...typography.label, color: colors.textSecondary },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    flex: 1,
    justifyContent: 'center',
    ...shadows.card,
  },
  playText: { ...typography.caption, color: colors.black, fontWeight: '700' },
})
