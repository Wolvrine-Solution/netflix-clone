import * as SecureStore from 'expo-secure-store'
import {
  storeToken,
  getToken,
  clearToken,
  storeUser,
  getStoredUser,
  isTokenExpired,
  type StoredUser,
} from '../auth'

function base64UrlEncode(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
}

function makeToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' })
  const body = base64UrlEncode(payload)
  return `${header}.${body}.signature`
}

describe('lib/auth', () => {
  beforeEach(() => {
    ;(SecureStore as unknown as { __reset: () => void }).__reset()
    jest.clearAllMocks()
  })

  describe('token storage', () => {
    it('storeToken then getToken round-trips the value', async () => {
      await storeToken('abc.def.ghi')
      const token = await getToken()
      expect(token).toBe('abc.def.ghi')
    })

    it('getToken returns null when nothing stored', async () => {
      const token = await getToken()
      expect(token).toBeNull()
    })

    it('clearToken removes both the token and user', async () => {
      await storeToken('abc.def.ghi')
      const user: StoredUser = { id: '1', name: 'Alex', email: 'a@b.com', image: null }
      await storeUser(user)

      await clearToken()

      expect(await getToken()).toBeNull()
      expect(await getStoredUser()).toBeNull()
    })
  })

  describe('user storage', () => {
    it('storeUser then getStoredUser round-trips the object', async () => {
      const user: StoredUser = { id: '1', name: 'Alex', email: 'a@b.com', image: null }
      await storeUser(user)
      const stored = await getStoredUser()
      expect(stored).toEqual(user)
    })

    it('getStoredUser returns null when nothing is stored', async () => {
      expect(await getStoredUser()).toBeNull()
    })

    it('getStoredUser returns null (does not throw) when stored JSON is corrupt', async () => {
      await (SecureStore.setItemAsync as jest.Mock)('netflix_user', 'not-json{{')
      const stored = await getStoredUser()
      expect(stored).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('returns false for a token with exp in the future', () => {
      const future = Math.floor(Date.now() / 1000) + 3600
      const token = makeToken({ exp: future })
      expect(isTokenExpired(token)).toBe(false)
    })

    it('returns true for a token with exp in the past', () => {
      const past = Math.floor(Date.now() / 1000) - 3600
      const token = makeToken({ exp: past })
      expect(isTokenExpired(token)).toBe(true)
    })

    it('returns true for a malformed token (wrong number of segments)', () => {
      expect(isTokenExpired('not-a-jwt')).toBe(true)
    })

    it('returns true when the payload segment is not valid base64 JSON', () => {
      const token = 'header.%%%notbase64%%%.signature'
      expect(isTokenExpired(token)).toBe(true)
    })

    it('returns true when exp is exactly now (boundary, expired per >=)', () => {
      const nowSeconds = Math.floor(Date.now() / 1000)
      const token = makeToken({ exp: nowSeconds })
      expect(isTokenExpired(token)).toBe(true)
    })
  })
})
