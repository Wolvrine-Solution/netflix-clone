import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { useMyList } from '../../../hooks/useMyList'
import { useModalStore } from '../../../store/useModalStore'
import { ContentModal } from '../../../components/home/ContentModal'
import { Colors } from '../../../constants/colors'
import { getPosterUrl } from '../../../lib/utils'
import type { ContentItem } from '@netflix/types'

export default function MyListScreen() {
  const { myList, isLoading, removeFromList } = useMyList()
  const openModal = useModalStore((s) => s.openModal)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
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
        My List
      </Text>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.red} />
        </View>
      ) : myList.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 16, textAlign: 'center' }}>
            Your list is empty.{'\n'}Browse content and tap + to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={myList}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }: { item: ContentItem }) => (
            <TouchableOpacity
              style={{ flex: 1 / 3, padding: 2 }}
              onPress={() => openModal(item)}
              onLongPress={() => removeFromList(item.id)}
              delayLongPress={500}
            >
              <View style={{ aspectRatio: 2 / 3 }}>
                <Image
                  source={{ uri: getPosterUrl(item.posterPath) }}
                  style={{ flex: 1, borderRadius: 4 }}
                  contentFit="cover"
                />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 4 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ContentModal />
    </SafeAreaView>
  )
}
