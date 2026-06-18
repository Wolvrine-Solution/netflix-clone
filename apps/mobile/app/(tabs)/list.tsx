import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import PosterCard from '../../components/PosterCard'
import { myList } from '../../lib/mockData'
import { colors, spacing, typography } from '../../theme'

export default function MyListScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>My List</Text>

      {myList.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={56} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptyBody}>Add movies and shows to keep track of what you want to watch.</Text>
        </View>
      ) : (
        <FlatList
          data={myList}
          keyExtractor={(t) => t.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: 80 + insets.bottom }]}
          renderItem={({ item }) => <PosterCard title={item} width={108} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.title, color: colors.text, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  grid: { paddingHorizontal: spacing.lg },
  row: { gap: spacing.sm, marginBottom: spacing.sm },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: 80,
  },
  emptyTitle: { ...typography.heading, color: colors.text },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
})
