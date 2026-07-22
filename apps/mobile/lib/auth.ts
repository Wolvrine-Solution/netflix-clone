import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'netflix_jwt'
const USER_KEY = 'netflix_user'

// expo-secure-store has no web implementation — ExpoSecureStore.web.js is a
// stub `{}` with none of SecureStore's methods, so any call throws on web.
// There's no Keychain/Keystore equivalent in a browser; localStorage is the
// standard fallback Expo's own docs point to for this exact gap.
const store =
  Platform.OS === 'web'
    ? {
        setItemAsync: async (key: string, value: string) => {
          window.localStorage.setItem(key, value)
        },
        getItemAsync: async (key: string) => window.localStorage.getItem(key),
        deleteItemAsync: async (key: string) => {
          window.localStorage.removeItem(key)
        },
      }
    : SecureStore

export interface StoredUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

export async function storeToken(token: string): Promise<void> {
  await store.setItemAsync(TOKEN_KEY, token)
}

export async function getToken(): Promise<string | null> {
  return store.getItemAsync(TOKEN_KEY)
}

export async function clearToken(): Promise<void> {
  await store.deleteItemAsync(TOKEN_KEY)
  await store.deleteItemAsync(USER_KEY)
}

export async function storeUser(user: StoredUser): Promise<void> {
  await store.setItemAsync(USER_KEY, JSON.stringify(user))
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw = await store.getItemAsync(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]!))
    const exp = payload.exp as number
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}
