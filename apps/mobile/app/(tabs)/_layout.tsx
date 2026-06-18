import { Tabs } from 'expo-router'
import { BlurView } from 'expo-blur'
import { Platform, StyleSheet, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const TABS: Array<{ name: string; label: string; icon: IconName; iconActive: IconName }> = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'search', label: 'Search', icon: 'search-outline', iconActive: 'search' },
  { name: 'new', label: 'New & Hot', icon: 'flame-outline', iconActive: 'flame' },
  { name: 'list', label: 'My List', icon: 'bookmark-outline', iconActive: 'bookmark' },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
]

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56 + insets.bottom,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderTopWidth: 0.5, borderTopColor: colors.border }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(10,10,11,0.92)', borderTopWidth: 0.5, borderTopColor: colors.border },
              ]}
            />
          ),
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarIconStyle: { marginTop: 6 },
      }}
    >
      {TABS.map(({ name, label, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: label,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? iconActive : icon} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
