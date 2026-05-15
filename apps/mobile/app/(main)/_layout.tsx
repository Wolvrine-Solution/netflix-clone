import { Tabs } from 'expo-router'
import { View, Text, TouchableOpacity } from 'react-native'
import { Colors } from '../../constants/colors'

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text
        style={{
          color: focused ? Colors.white : Colors.lightGray,
          fontSize: 11,
          fontWeight: focused ? '700' : '400',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.black,
          borderTopColor: Colors.mediumGray,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Search" />,
        }}
      />
      <Tabs.Screen
        name="my-list"
        options={{
          title: 'My List',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="My List" />,
        }}
      />
      <Tabs.Screen
        name="watch"
        options={{
          href: null, // hide from tab bar
        }}
      />
    </Tabs>
  )
}
