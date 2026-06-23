import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSearch } from '../../../hooks/useSearch'
import { SearchInput } from '../../../components/search/SearchInput'
import { ContentCard } from '../../../components/home/ContentCard'
import { ContentModal } from '../../../components/home/ContentModal'
import { Colors } from '../../../constants/colors'

export default function SearchScreen() {
  const { query, setQuery, results, isLoading, hasQuery } = useSearch()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <SearchInput value={query} onChangeText={setQuery} />
      </View>

      {!hasQuery ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.lightGray, fontSize: 16 }}>Search movies and TV shows</Text>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.red} />
        </View>
      ) : results.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.lightGray, fontSize: 16 }}>No results for "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={{ flex: 1 / 3, padding: 2 }}>
              <ContentCard content={item} />
            </View>
          )}
          contentContainerStyle={{ padding: 4 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ContentModal />
    </SafeAreaView>
  )
}
