import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())

const cc = async (method: 'GET' | 'POST', url: string) =>
  (await t.request(method, url)).headers['cache-control']

describe('Cache-Control rules (match the former Express table)', () => {
  it('catalog GETs are CDN-cacheable under both mounts', async () => {
    for (const url of ['/api/content', '/api/v1/content', '/api/rows', '/api/v1/search?q=ab'])
      expect(await cc('GET', url)).toBe('public, max-age=60, stale-while-revalidate=300')
  })

  it('everything else under /api is no-store, including non-GET catalog routes', async () => {
    expect(await cc('GET', '/api/notifications')).toBe('no-store')
    expect(await cc('GET', '/api/v1/profiles')).toBe('no-store')
    expect(await cc('POST', '/api/auth/signin')).toBe('no-store')
  })

  it('does not stamp non-api routes', async () => {
    expect(await cc('GET', '/health')).toBeUndefined()
  })
})
