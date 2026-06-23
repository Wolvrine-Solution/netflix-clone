import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useProfileStore } from '../../store/useProfileStore'
import { clearToken } from '../../lib/auth'
import { Colors } from '../../constants/colors'

export function Navbar() {
  const insets = useSafeAreaInsets()
  const { activeProfile, setActiveProfile } = useProfileStore()

  async function handleSignOut() {
    await clearToken()
    setActiveProfile(null)
    router.replace('/(auth)/login')
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'transparent',
      }}
    >
      {/* Logo */}
      <Text style={{ color: Colors.red, fontSize: 28, fontWeight: '900', letterSpacing: 2 }}>
        NETFLIX
      </Text>

      {/* Right: profile avatar */}
      <TouchableOpacity
        onPress={() => router.push('/profiles')}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      >
        {activeProfile?.avatarUrl ? (
          <Image
            source={{ uri: activeProfile.avatarUrl }}
            style={{ width: 32, height: 32, borderRadius: 4 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 4,
              backgroundColor: Colors.red,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>
              {activeProfile?.name?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}
