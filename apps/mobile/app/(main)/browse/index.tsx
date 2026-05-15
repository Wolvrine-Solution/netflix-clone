import { View, ScrollView, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../../lib/api'
import { HeroBanner } from '../../../components/home/HeroBanner'
import { ContentRow } from '../../../components/home/ContentRow'
import { ContentModal } from '../../../components/home/ContentModal'
import { Navbar } from '../../../components/layout/Navbar'
import { Colors } from '../../../constants/colors'

export default function BrowseScreen() {
  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: () => api.featured().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  })

  const { data: rows, isLoading: rowsLoading } = useQuery({
    queryKey: ['rows'],
    queryFn: () => api.rows().then((r) => r.data.data),
    staleTime: 1000 * 60 * 10,
  })

  const isLoading = featuredLoading || rowsLoading

  return (
    <View style={{ flex: 1, backgroundColor: Colors.black }}>
      <Navbar />
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.red} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <HeroBanner content={featured ?? null} />
          {rows?.map((row) => (
            <ContentRow key={row.id} title={row.title} items={row.items} />
          ))}
        </ScrollView>
      )}
      <ContentModal />
    </View>
  )
}
