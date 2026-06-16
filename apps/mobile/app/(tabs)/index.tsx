import { ScrollView, StyleSheet, View, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Hero } from '../../components/Hero'
import ContentRow from '../../components/ContentRow'
import { SectionHeader } from '../../components/SectionHeader'
import Top10Row from '../../components/Top10Row'
import { colors, spacing } from '../../theme'
import { featured, rows } from '../../lib/mockData'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <Hero
        content={featured}
        onPlay={() => {}}
        onInfo={() => {}}
        onList={() => {}}
      />

      <View style={styles.rows}>
        <ContentRow
          title="Continue Watching"
          data={[...rows.continueWatching]}
          showProgress
          cardWidth={148}
        />
        <ContentRow title="Trending Now" data={[...rows.trending]} cardWidth={124} />
        <Top10Row title="Top 10 in Your Country" data={[...rows.topTen]} />
        <ContentRow title="New Releases" data={[...rows.newReleases]} cardWidth={124} />
        <ContentRow title="Popular on Netflix" data={[...rows.trending].reverse()} cardWidth={124} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  rows: { gap: spacing.xl, paddingTop: spacing.lg },
})
