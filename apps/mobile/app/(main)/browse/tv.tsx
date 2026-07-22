import { View, FlatList, ActivityIndicator, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../../lib/api'
import { ContentCard } from '../../../components/home/ContentCard'
import { ContentModal } from '../../../components/home/ContentModal'
import { Navbar } from '../../../components/layout/Navbar'
import { Colors } from '../../../constants/colors'

export default function TVShowsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['content', 'tv'],
    queryFn: () =>
      api.rows().then((r) => {
        const allItems = r.data.data.flatMap((row) => row.items)
        return allItems.filter((c) => c.mediaType === 'tv')
      }),
    staleTime: 1000 * 60 * 10,
  })

  return (
    <View style={{ flex: 1, backgroundColor: Colors.black }}>
      <Navbar />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Text
          style={{
            color: Colors.white,
            fontSize: 22,
            fontWeight: '700',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
          }}
        >
          TV Shows
        </Text>
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.red} />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
              <View style={{ flex: 1 / 3, padding: 2 }}>
                <ContentCard content={item} />
              </View>
            )}
            contentContainerStyle={{ padding: 4 }}
          />
        )}
      </SafeAreaView>
      <ContentModal />
    </View>
  )
}
