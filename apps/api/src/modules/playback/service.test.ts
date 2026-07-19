import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'
import { signUrl } from './service'

describe('signUrl CDN signing', () => {
  it('appends exp and sig query params', () => {
    const secret = 'dev-only-change-me-32chars-min!!'
    const url = 'https://cdn.example.com/hls/master.m3u8'
    const signed = signUrl(url, 3600, secret)
    expect(signed).toContain('exp=')
    expect(signed).toContain('sig=')
    const exp = Number(new URL(signed).searchParams.get('exp'))
    const sig = new URL(signed).searchParams.get('sig')
    const expected = createHmac('sha256', secret).update(`${url}:${exp}`).digest('hex')
    expect(sig).toBe(expected)
  })
})
