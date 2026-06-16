import { useState, useMemo } from 'react'
import {
  FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { catalogue } from '../../lib/mockData'
import { colors, radii, shadows, spacing, typography } from '../../theme'
import type { Title } from '../../lib/mockData'

const GENRES = ['All', 'Sci-Fi', 'Drama', 'Action', 'Thriller', 'Horror', 'Animation', 'Comedy', 'Crime']

function ResultCard({ item }: { item: Title }) {
  const CARD_W = 108
  const CARD_H = CARD_W * 1.5
  return (
    <TouchableOpacity style={[styles.resultCard, { width: CARD_W, height: CARD_H }, shadows.card]}>
      <Image source={{ uri: item.poster }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
    </TouchableOpacity>
  )
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('All')

  const results = useMemo(() => {
    return catalogue.filter((t) => {
      const matchQ = !query || t.title.toLowerCase().includes(query.toLowerCase())
      const matchG = genre === 'All' || t.genres.includes(genre)
      return matchQ && matchG
    })
  }, [query, genre])

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles, genres..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Genre filter chips */}
      <FlatList
        data={GENRES}
        keyExtractor={(g) => g}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setGenre(item)}
            style={[styles.chip, item === genre && styles.chipActive]}
          >
            <Text style={[styles.chipText, item === genre && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Results grid */}
      <FlatList
        data={results}
        keyExtractor={(t) => t.id}
        numColumns={3}
        contentContainerStyle={[styles.grid, { paddingBottom: 80 + insets.bottom }]}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          </View>
        }
        renderItem={({ item }) => <ResultCard item={item} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: { flex: 1, ...typography.body, color: colors.text },
  chips: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  grid: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  row: { gap: spacing.sm, marginBottom: spacing.sm },
  resultCard: { borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface, ...shadows.card },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.lg },
  emptyText: { ...typography.body, color: colors.textMuted },
})
