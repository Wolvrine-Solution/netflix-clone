import { View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { clearToken } from '../../../lib/auth'
import { useProfileStore } from '../../../store/useProfileStore'
import { useSettingsStore } from '../../../store/useSettingsStore'
import { Colors } from '../../../constants/colors'

interface SettingRow {
  label: string
  value?: string
  toggle?: boolean
  on?: boolean
  onToggle?: (v: boolean) => void
  onPress?: () => void
  color?: string
}

export default function SettingsScreen() {
  const { activeProfile, setActiveProfile } = useProfileStore()
  const {
    autoPlay,
    setAutoPlay,
    autoPlayPreviews,
    setAutoPlayPreviews,
    wifiOnly,
    setWifiOnly,
    notifications,
    setNotifications,
    playbackQuality,
    setPlaybackQuality,
    downloadQuality,
    setDownloadQuality,
  } = useSettingsStore()

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearToken()
          setActiveProfile(null)
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  function showPlaybackQualityPicker() {
    const options: Array<typeof playbackQuality> = ['auto', '1080p', '720p', '480p', '360p']
    Alert.alert('Playback Quality', 'Higher quality uses more data.', [
      ...options.map((q) => ({
        text: q === playbackQuality ? `${q} ✓` : q,
        onPress: () => setPlaybackQuality(q),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  function showDownloadQualityPicker() {
    Alert.alert('Download Quality', 'Higher quality uses more storage.', [
      {
        text: downloadQuality === 'standard' ? 'Standard ✓' : 'Standard',
        onPress: () => setDownloadQuality('standard'),
      },
      {
        text: downloadQuality === 'high' ? 'High ✓' : 'High',
        onPress: () => setDownloadQuality('high'),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ])
  }

  function Section({ title, rows }: { title: string; rows: SettingRow[] }) {
    return (
      <View style={{ marginBottom: 24 }}>
        {title ? (
          <Text
            style={{
              color: Colors.lightGray,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1,
              paddingHorizontal: 16,
              marginBottom: 8,
            }}
          >
            {title}
          </Text>
        ) : null}
        <View style={{ backgroundColor: Colors.darkGray, borderRadius: 12, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              disabled={row.toggle}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: Colors.lightGray, fontSize: 14 }}>{row.value}</Text>
                  <Text style={{ color: Colors.lightGray, fontSize: 16 }}>›</Text>
                </View>
              ) : row.onPress ? (
                <Text style={{ color: Colors.lightGray, fontSize: 16 }}>›</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  const qualityLabel: Record<typeof playbackQuality, string> = {
    auto: 'Auto',
    '1080p': '1080p',
    '720p': '720p',
    '480p': '480p',
    '360p': '360p',
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '800' }}>More</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {/* Profile card */}
        {activeProfile && (
          <View
            style={{
              backgroundColor: Colors.darkGray,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                backgroundColor: Colors.red,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: Colors.white, fontSize: 22, fontWeight: '700' }}>
                {activeProfile.name[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.white, fontWeight: '700', fontSize: 16 }}>
                {activeProfile.name}
              </Text>
              <Text style={{ color: Colors.lightGray, fontSize: 13, marginTop: 2 }}>
                {activeProfile.isKid ? 'Kids Profile' : 'Standard Profile'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profiles')} activeOpacity={0.7}>
              <Text style={{ color: Colors.red, fontSize: 14 }}>Switch</Text>
            </TouchableOpacity>
          </View>
        )}

        <Section
          title="Playback"
          rows={[
            { label: 'Auto-Play Next Episode', toggle: true, on: autoPlay, onToggle: setAutoPlay },
            {
              label: 'Auto-Play Previews',
              toggle: true,
              on: autoPlayPreviews,
              onToggle: setAutoPlayPreviews,
            },
            {
              label: 'Playback Quality',
              value: qualityLabel[playbackQuality],
              onPress: showPlaybackQualityPicker,
            },
          ]}
        />

        <Section
          title="Downloads"
          rows={[
            { label: 'Wi-Fi Only', toggle: true, on: wifiOnly, onToggle: setWifiOnly },
            {
              label: 'Download Quality',
              value: downloadQuality === 'high' ? 'High' : 'Standard',
              onPress: showDownloadQualityPicker,
            },
            {
              label: 'Delete All Downloads',
              onPress: () =>
                Alert.alert('Delete Downloads', 'Remove all downloaded content?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive' },
                ]),
              color: Colors.lightGray,
            },
          ]}
        />

        <Section
          title="Notifications"
          rows={[
            {
              label: 'Push Notifications',
              toggle: true,
              on: notifications,
              onToggle: setNotifications,
            },
          ]}
        />

        <Section
          title="Account"
          rows={[
            {
              label: 'Account Settings',
              onPress: () =>
                Alert.alert('Account Settings', 'Manage your account on the Netflix website.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Website',
                    onPress: () => Linking.openURL('https://www.netflix.com/YourAccount'),
                  },
                ]),
            },
            {
              label: 'Subscription',
              onPress: () =>
                Alert.alert('Subscription', 'Manage your subscription on the Netflix website.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Website',
                    onPress: () => Linking.openURL('https://www.netflix.com/YourAccount'),
                  },
                ]),
            },
            {
              label: 'Privacy Policy',
              onPress: () => Linking.openURL('https://help.netflix.com/legal/privacy'),
            },
            {
              label: 'Help Center',
              onPress: () => Linking.openURL('https://help.netflix.com'),
            },
          ]}
        />

        <Section
          title=""
          rows={[{ label: 'Sign Out', onPress: handleSignOut, color: Colors.red }]}
        />

        <Text style={{ textAlign: 'center', color: Colors.lightGray, fontSize: 12, marginTop: 8 }}>
          Netflix Clone v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}
