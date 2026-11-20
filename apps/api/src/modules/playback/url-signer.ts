import { createHmac } from 'node:crypto'

/**
 * CDN signed URL: appends `exp` (unix seconds) and `sig` = HMAC-SHA256(secret, `${url}:${exp}`).
 * The edge recomputes the same HMAC, so this format must not change.
 */
export function signUrl(url: string, secret: string, ttlSec = 3600, nowMs = Date.now()): string {
  const exp = Math.floor(nowMs / 1000) + ttlSec
  const sig = createHmac('sha256', secret).update(`${url}:${exp}`).digest('hex')
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}exp=${exp}&sig=${sig}`
}
