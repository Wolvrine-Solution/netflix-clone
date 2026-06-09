import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useState } from 'react'
import { clearToken } from '../../../lib/auth'
import { useProfileStore } from '../../../store/useProfileStore'
import { Colors } from '../../../constants/colors'

interface SettingRow {
  label: string; value?: string; toggle?: boolean; on?: boolean
  onToggle?: (v: boolean) => void; onPress?: () => void
  color?: string
}

export default function SettingsScreen() {
  const { activeProfile, setActiveProfile } = useProfileStore()
  const [autoPlay, setAutoPlay] = useState(true)
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(true)
  const [wifiOnly, setWifiOnly] = useState(false)
  const [notifs, setNotifs] = useState(true)

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await clearToken()
          setActiveProfile(null)
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  function Section({ title, rows }: { title: string; rows: SettingRow[] }) {
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: Colors.lightGray, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8 }}>
          {title}
        </Text>
        <View style={{ backgroundColor: Colors.darkGray, borderRadius: 12, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              disabled={row.toggle}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                borderBottomColor: Colors.mediumGray,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: row.color ?? Colors.white, fontSize: 15 }}>{row.label}</Text>
              {row.toggle !== undefined ? (
                <Switch
                  value={row.on}
                  onValueChange={row.onToggle}
                  trackColor={{ false: Colors.mediumGray, true: Colors.red }}
                  thumbColor={Colors.white}
                />
              ) : row.value ? (
                <Text style={{ color: Colors.lightGray, fontSize: 14 }}>{row.value}</Text>
              ) : (
                <Text style={{ color: Colors.lightGray, fontSize: 16 }}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '800' }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Profile card */}
        {activeProfile && (
          <View style={{ backgroundColor: Colors.darkGray, borderRadius: 12, padding: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 6, backgroundColor: Colors.red, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '700' }}>
                {activeProfile.name[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 16 }}>{activeProfile.name}</Text>
              <Text style={{ color: Colors.lightGray, fontSize: 13, marginTop: 2 }}>
                {activeProfile.isKid ? 'Kids Profile' : 'Standard Profile'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profiles')} activeOpacity={0.7}>
              <Text style={{ color: Colors.red, fontSize: 14 }}>Switch</Text>
            </TouchableOpacity>
          </View>
        )}

        <Section title="Playback" rows={[
          { label: 'Auto-Play Next Episode', toggle: true, on: autoPlay, onToggle: setAutoPlay },
          { label: 'Auto-Play Previews', toggle: true, on: autoPlayPreviews, onToggle: setAutoPlayPreviews },
          { label: 'Playback Quality', value: 'Auto', onPress: () => {} },
        ]} />

        <Section title="Downloads" rows={[
          { label: 'Wi-Fi Only', toggle: true, on: wifiOnly, onToggle: setWifiOnly },
          { label: 'Download Quality', value: 'Standard', onPress: () => {} },
          { label: 'Delete All Downloads', onPress: () => Alert.alert('Delete Downloads', 'Remove all downloaded content?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }]), color: Colors.lightGray },
        ]} />

        <Section title="Notifications" rows={[
          { label: 'Push Notifications', toggle: true, on: notifs, onToggle: setNotifs },
        ]} />

        <Section title="Account" rows={[
          { label: 'Account Settings', onPress: () => {} },
          { label: 'Subscription', onPress: () => {} },
          { label: 'Privacy Policy', onPress: () => {} },
          { label: 'Help Center', onPress: () => {} },
        ]} />

        <Section title="" rows={[
          { label: 'Sign Out', onPress: handleSignOut, color: Colors.red },
        ]} />

        <Text style={{ textAlign: 'center', color: Colors.lightGray, fontSize: 12, marginTop: 8 }}>
          Netflix Clone v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
