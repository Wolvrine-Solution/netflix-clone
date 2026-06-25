jest.mock('../auth', () => ({
  getToken: jest.fn(),
}))

import { getToken } from '../auth'
import { apiClient } from '../api'

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('attaches an Authorization header when a token is present', async () => {
    ;(getToken as jest.Mock).mockResolvedValueOnce('my-jwt-token')

    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      headers: {},
    } as never)

    expect(config.headers['Authorization']).toBe('Bearer my-jwt-token')
  })

  it('does not attach an Authorization header when there is no token', async () => {
    ;(getToken as jest.Mock).mockResolvedValueOnce(null)

    const config = await apiClient.interceptors.request.handlers[0].fulfilled({
      headers: {},
    } as never)

    expect(config.headers['Authorization']).toBeUndefined()
  })

  it('uses the default localhost API base URL when EXPO_PUBLIC_API_URL is unset', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:4000/api')
  })
})
