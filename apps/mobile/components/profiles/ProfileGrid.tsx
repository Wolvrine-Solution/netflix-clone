import { View, TouchableOpacity, Text, FlatList } from 'react-native'
import { ProfileCard } from './ProfileCard'
import { Colors } from '../../constants/colors'
import type { NetflixProfile } from '@netflix/types'

interface ProfileGridProps {
  profiles: NetflixProfile[]
  onSelect: (profile: NetflixProfile) => void
  onManage: () => void
}

export function ProfileGrid({ profiles, onSelect, onManage }: ProfileGridProps) {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ justifyContent: 'center' }}
        renderItem={({ item }) => <ProfileCard profile={item} onSelect={onSelect} />}
        ListFooterComponent={
          profiles.length < 5 ? (
            <TouchableOpacity
              onPress={onManage}
              style={{ alignItems: 'center', margin: 12 }}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  backgroundColor: Colors.mediumGray,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: Colors.lightGray,
                  borderStyle: 'dashed',
                }}
              >
                <Text style={{ color: Colors.lightGray, fontSize: 32 }}>+</Text>
              </View>
              <Text style={{ color: Colors.lightGray, fontSize: 14, marginTop: 8 }}>Add Profile</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <TouchableOpacity
        onPress={onManage}
        style={{
          marginTop: 24,
          borderWidth: 1,
          borderColor: Colors.lightGray,
          paddingHorizontal: 24,
          paddingVertical: 10,
          borderRadius: 4,
        }}
      >
        <Text style={{ color: Colors.lightGray, fontSize: 14, fontWeight: '600', letterSpacing: 1 }}>
          MANAGE PROFILES
        </Text>
      </TouchableOpacity>
    </View>
  )
}
