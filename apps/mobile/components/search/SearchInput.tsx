import { View, TextInput, TouchableOpacity, Text } from 'react-native'
import { Colors } from '../../constants/colors'

interface SearchInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChangeText, placeholder = 'Titles, people, genres' }: SearchInputProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.mediumGray,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      <Text style={{ color: Colors.lightGray, fontSize: 16 }}>🔍</Text>
      <TextInput
        style={{ flex: 1, color: Colors.white, fontSize: 16 }}
        placeholder={placeholder}
        placeholderTextColor={Colors.lightGray}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Text style={{ color: Colors.lightGray, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
