import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../test/harness'

let t: TestApp
beforeAll(async () => {
  t = await createTestApp()
})
afterAll(() => t.close())

describe('user journey over HTTP on a real Postgres engine', () => {
  it('sign in, create a profile, browse, add to My List, get a playback token', async () => {
    await t.seedUser({ email: 'viewer@test.dev', password: 'pw-123456' })
    const content = await t.seedContent({ title: 'Journey Movie', genres: ['Drama'] })

    const signin = await t.request('POST', '/api/v1/auth/signin', {
      body: { email: 'viewer@test.dev', password: 'pw-123456' },
    })
    expect(signin.status).toBe(200)
    const token = signin.body.token as string

    const profile = await t.request('POST', '/api/v1/profiles', {
      token,
      body: { name: 'Me', avatarUrl: 'a.png' },
    })
    expect(profile.status).toBe(201)
    const profileId = profile.body.data.id as string

    const browse = await t.request('GET', '/api/v1/content', { token })
    expect(browse.body.data.map((c: { title: string }) => c.title)).toContain('Journey Movie')

    const add = await t.request('POST', `/api/v1/profiles/${profileId}/my-list`, {
      token,
      body: { contentId: content.id },
    })
    expect(add.status).toBe(201)
    const list = await t.request('GET', `/api/v1/profiles/${profileId}/my-list`, { token })
    expect(list.body.data[0].id).toBe(content.id)

    const play = await t.request('POST', `/api/v1/playback/${content.id}`, {
      token,
      body: { profileId },
    })
    // No subscription seeded: entitlement must say so rather than hand out a token.
    expect(play.status).toBe(403)
  })
})

describe('OpenAPI document', () => {
  it('is served and covers the public surface', async () => {
    const res = await t.request('GET', '/api/v1/openapi.json')
    expect(res.status).toBe(200)
    expect(res.body.openapi).toMatch(/^3\./)
    const paths = Object.keys(res.body.paths)
    for (const p of [
      '/api/v1/content',
      '/api/v1/auth/signin',
      '/api/v1/playback/{contentId}',
      '/api/v1/billing/checkout',
      '/api/v1/live/channels',
      '/api/admin/content',
      '/webhooks/stripe',
    ])
      expect(paths, p).toContain(p)
  })
})
