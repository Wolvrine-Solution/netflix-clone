import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Colors } from '../../constants/colors'
import type { NetflixProfile } from '@netflix/types'

interface ProfileCardProps {
  profile: NetflixProfile
  onSelect: (profile: NetflixProfile) => void
}

export function ProfileCard({ profile, onSelect }: ProfileCardProps) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(profile)}
      style={{ alignItems: 'center', margin: 12 }}
      activeOpacity={0.8}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 8,
          overflow: 'hidden',
          borderWidth: 2,
          borderColor: 'transparent',
        }}
      >
        <Image source={{ uri: profile.avatarUrl }} style={{ flex: 1 }} contentFit="cover" />
      </View>
      <Text
        style={{
          color: Colors.lightGray,
          fontSize: 14,
          marginTop: 8,
          fontWeight: '500',
        }}
      >
        {profile.name}
      </Text>
      {profile.isKid && (
        <View
          style={{
            backgroundColor: Colors.mediumGray,
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginTop: 4,
          }}
        >
          <Text style={{ color: Colors.lightGray, fontSize: 10, fontWeight: '700' }}>KIDS</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}
