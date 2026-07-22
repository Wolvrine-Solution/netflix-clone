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
import { storeToken, storeUser } from '../../lib/auth'
import { Colors } from '../../constants/colors'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.auth.signIn(email.trim(), password)
      await storeToken(data.token)
      await storeUser(data.user)
      router.replace('/profiles')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid email or password.'
      Alert.alert('Sign In Failed', msg)
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
        {/* Logo */}
        <Text
          style={{
            color: Colors.red,
            fontSize: 36,
            fontWeight: '900',
            textAlign: 'center',
            marginBottom: 48,
          }}
        >
          NETFLIX
        </Text>

        <Text style={{ color: Colors.white, fontSize: 28, fontWeight: '700', marginBottom: 24 }}>
          Sign In
        </Text>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 13, marginBottom: 6 }}>Email</Text>
          <TextInput
            style={{
              backgroundColor: Colors.mediumGray,
              borderRadius: 4,
              padding: 14,
              color: Colors.white,
              fontSize: 16,
            }}
            placeholder="Enter your email"
            placeholderTextColor={Colors.lightGray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        {/* Password */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 13, marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{
              backgroundColor: Colors.mediumGray,
              borderRadius: 4,
              padding: 14,
              color: Colors.white,
              fontSize: 16,
            }}
            placeholder="Enter your password"
            placeholderTextColor={Colors.lightGray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={{
            backgroundColor: Colors.red,
            borderRadius: 4,
            padding: 16,
            alignItems: 'center',
            marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={{ color: Colors.white, fontSize: 16, fontWeight: '700' }}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Register link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: Colors.lightGray, fontSize: 14 }}>New to Netflix?</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={{ color: Colors.white, fontSize: 14, fontWeight: '700' }}>
                Sign up now.
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
