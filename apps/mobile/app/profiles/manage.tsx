import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { api } from '../../lib/api'
import { Colors } from '../../constants/colors'
import type { NetflixProfile } from '@netflix/types'

const AVATAR_OPTIONS = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  'https://i.pravatar.cc/150?img=6',
]

export default function ManageProfilesScreen() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]!)
  const [isKid, setIsKid] = useState(false)
  const [creating, setCreating] = useState(false)

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.profiles.list().then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: () => api.profiles.create({ name: name.trim(), avatarUrl: selectedAvatar, isKid }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      setName('')
      setCreating(false)
    },
    onError: () => Alert.alert('Error', 'Failed to create profile.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.profiles.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
    onError: () => Alert.alert('Error', 'Failed to delete profile.'),
  })

  function confirmDelete(profile: NetflixProfile) {
    Alert.alert('Delete Profile', `Delete "${profile.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(profile.id) },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: Colors.mediumGray,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Text style={{ color: Colors.white, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.white, fontSize: 20, fontWeight: '700' }}>
          Manage Profiles
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {/* Existing profiles */}
        {isLoading ? (
          <ActivityIndicator color={Colors.red} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.mediumGray,
                }}
              >
                <Image
                  source={{ uri: item.avatarUrl }}
                  style={{ width: 56, height: 56, borderRadius: 4 }}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '600' }}>
                    {item.name}
                  </Text>
                  {item.isKid && (
                    <Text style={{ color: Colors.lightGray, fontSize: 12, marginTop: 2 }}>
                      KIDS
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => confirmDelete(item)} style={{ padding: 8 }}>
                  <Text style={{ color: Colors.red, fontSize: 14, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              (profiles?.length ?? 0) < 5 ? (
                <View style={{ marginTop: 24 }}>
                  {!creating ? (
                    <TouchableOpacity
                      style={{
                        borderWidth: 1,
                        borderColor: Colors.lightGray,
                        borderRadius: 4,
                        padding: 14,
                        alignItems: 'center',
                      }}
                      onPress={() => setCreating(true)}
                    >
                      <Text style={{ color: Colors.white, fontSize: 15, fontWeight: '600' }}>
                        + Add Profile
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View>
                      <Text
                        style={{
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: '700',
                          marginBottom: 12,
                        }}
                      >
                        New Profile
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: Colors.mediumGray,
                          borderRadius: 4,
                          padding: 12,
                          color: Colors.white,
                          marginBottom: 16,
                        }}
                        placeholder="Profile name"
                        placeholderTextColor={Colors.lightGray}
                        value={name}
                        onChangeText={setName}
                      />

                      {/* Avatar picker */}
                      <Text style={{ color: Colors.lightGray, fontSize: 13, marginBottom: 8 }}>
                        Choose Avatar
                      </Text>
                      <FlatList
                        data={AVATAR_OPTIONS}
                        keyExtractor={(u) => u}
                        horizontal
                        renderItem={({ item: url }) => (
                          <TouchableOpacity
                            onPress={() => setSelectedAvatar(url)}
                            style={{ marginRight: 8 }}
                          >
                            <Image
                              source={{ uri: url }}
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 4,
                                borderWidth: selectedAvatar === url ? 2 : 0,
                                borderColor: Colors.white,
                              }}
                            />
                          </TouchableOpacity>
                        )}
                        style={{ marginBottom: 16 }}
                      />

                      {/* Kids toggle */}
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
                        onPress={() => setIsKid(!isKid)}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: Colors.white,
                            backgroundColor: isKid ? Colors.white : 'transparent',
                            marginRight: 8,
                          }}
                        />
                        <Text style={{ color: Colors.white, fontSize: 14 }}>Kids Profile</Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            backgroundColor: Colors.white,
                            borderRadius: 4,
                            padding: 14,
                            alignItems: 'center',
                          }}
                          onPress={() => createMutation.mutate()}
                          disabled={createMutation.isPending || !name.trim()}
                        >
                          {createMutation.isPending ? (
                            <ActivityIndicator color={Colors.black} />
                          ) : (
                            <Text style={{ color: Colors.black, fontWeight: '700' }}>Save</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: Colors.lightGray,
                            borderRadius: 4,
                            padding: 14,
                            alignItems: 'center',
                          }}
                          onPress={() => setCreating(false)}
                        >
                          <Text style={{ color: Colors.white, fontWeight: '700' }}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}
