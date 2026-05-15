import { View, Text, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { api } from '../../lib/api'
import { useProfileStore } from '../../store/useProfileStore'
import { ProfileGrid } from '../../components/profiles/ProfileGrid'
import { Colors } from '../../constants/colors'
import type { NetflixProfile } from '@netflix/types'

export default function ProfilesScreen() {
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile)

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.profiles.list().then((r) => r.data.data),
  })

  function handleSelectProfile(profile: NetflixProfile) {
    setActiveProfile(profile)
    router.replace('/(main)/browse')
  }

  function handleManageProfiles() {
    router.push('/profiles/manage')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '700', marginBottom: 40 }}>
          Who's watching?
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.red} />
        ) : (
          <ProfileGrid
            profiles={profiles ?? []}
            onSelect={handleSelectProfile}
            onManage={handleManageProfiles}
          />
        )}
      </View>
    </SafeAreaView>
  )
}
