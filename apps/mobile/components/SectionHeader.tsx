import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, typography } from '../theme'

type Props = {
  title: string
  accent?: boolean
  onSeeAll?: () => void
}

function SectionHeader({ title, accent, onSeeAll }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {accent ? <View style={styles.bar} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onSeeAll ? (
        <Pressable
          style={styles.seeAll}
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={`See all ${title}`}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bar: { width: 4, height: 20, borderRadius: 2, backgroundColor: colors.red },
  title: { ...typography.heading, color: colors.text },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { ...typography.caption, color: colors.textSecondary },
})

export { SectionHeader }
export default React.memo(SectionHeader)
