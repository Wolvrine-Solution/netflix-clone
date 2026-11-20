import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { signUrl } from './url-signer'

const SECRET = 'dev-only-change-me-32chars-min!!'
const URL_ = 'https://cdn.example.com/hls/master.m3u8'

describe('signUrl CDN signing', () => {
  it('appends exp and an HMAC-SHA256 sig over `${url}:${exp}`', () => {
    const signed = signUrl(URL_, SECRET, 3600)
    const params = new URL(signed).searchParams
    const exp = Number(params.get('exp'))
    expect(exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    expect(params.get('sig')).toBe(
      createHmac('sha256', SECRET).update(`${URL_}:${exp}`).digest('hex')
    )
  })

  it('is deterministic for a fixed clock and ttl', () => {
    const now = Date.UTC(2026, 0, 1)
    expect(signUrl(URL_, SECRET, 60, now)).toBe(signUrl(URL_, SECRET, 60, now))
    expect(signUrl(URL_, SECRET, 60, now)).toContain(`exp=${Math.floor(now / 1000) + 60}`)
  })

  it('uses & when the url already has a query string', () => {
    const signed = signUrl(`${URL_}?part=1`, SECRET)
    expect(signed).toMatch(/\?part=1&exp=\d+&sig=[0-9a-f]{64}$/)
  })

  it('changes when the secret, url or expiry changes', () => {
    const now = 1_000_000
    const base = signUrl(URL_, SECRET, 60, now)
    expect(signUrl(URL_, 'another-secret-another-secret-12345', 60, now)).not.toBe(base)
    expect(signUrl(`${URL_}x`, SECRET, 60, now)).not.toBe(base)
    expect(signUrl(URL_, SECRET, 61, now)).not.toBe(base)
  })
})
