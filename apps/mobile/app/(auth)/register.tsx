import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import { router, Link } from 'expo-router'
import { api } from '../../lib/api'
import { Colors } from '../../constants/colors'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await api.auth.register(email.trim(), password, name.trim())
      Alert.alert('Account Created', 'Your account has been created. Please sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ])
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Registration failed. Please try again.'
      Alert.alert('Registration Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: Colors.red, fontSize: 36, fontWeight: '900', textAlign: 'center', marginBottom: 48 }}>
          NETFLIX
        </Text>

        <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '700', marginBottom: 24 }}>Create Account</Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 13, marginBottom: 6 }}>Name</Text>
          <TextInput
            style={{ backgroundColor: Colors.mediumGray, borderRadius: 4, padding: 14, color: Colors.white, fontSize: 16 }}
            placeholder="Your name"
            placeholderTextColor={Colors.lightGray}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 13, marginBottom: 6 }}>Email</Text>
          <TextInput
            style={{ backgroundColor: Colors.mediumGray, borderRadius: 4, padding: 14, color: Colors.white, fontSize: 16 }}
            placeholder="Enter your email"
            placeholderTextColor={Colors.lightGray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 13, marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{ backgroundColor: Colors.mediumGray, borderRadius: 4, padding: 14, color: Colors.white, fontSize: 16 }}
            placeholder="At least 8 characters"
            placeholderTextColor={Colors.lightGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: Colors.red,
            borderRadius: 4,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 14 }}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>Sign in.</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
