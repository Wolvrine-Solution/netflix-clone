import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { getToken, isTokenExpired } from '../lib/auth'
import { useProfileStore } from '../store/useProfileStore'
import { Colors } from '../constants/colors'

export default function IndexScreen() {
  const activeProfile = useProfileStore((s) => s.activeProfile)

  useEffect(() => {
    async function bootstrap() {
      const token = await getToken()
      if (!token || isTokenExpired(token)) {
        router.replace('/(auth)/login')
        return
      }
      if (!activeProfile) {
        router.replace('/profiles')
        return
      }
      router.replace('/(main)/browse')
    }
    bootstrap()
  }, [activeProfile])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.black,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator size="large" color={Colors.red} />
    </View>
  )
}
