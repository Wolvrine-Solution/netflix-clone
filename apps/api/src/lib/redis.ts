import { getEnv } from './env'
import { logger } from './logger'

type RedisLike = {
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode?: string, ttl?: number): Promise<unknown>
  del(...keys: string[]): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  keys(pattern: string): Promise<string[]>
}

class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>()

  private purge(key: string) {
    const entry = this.store.get(key)
    if (entry?.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry?.value ?? null
  }

  async get(key: string) {
    return this.purge(key)
  }

  async set(key: string, value: string, mode?: string, ttl?: number) {
    const expiresAt = mode === 'EX' && ttl ? Date.now() + ttl * 1000 : undefined
    this.store.set(key, { value, expiresAt })
    return 'OK'
  }

  async del(...keys: string[]) {
    let n = 0
    for (const k of keys) {
      if (this.store.delete(k)) n++
    }
    return n
  }

  async incr(key: string) {
    const cur = Number((await this.get(key)) ?? '0')
    const next = cur + 1
    await this.set(key, String(next))
    return next
  }

  async expire(key: string, seconds: number) {
    const val = await this.get(key)
    if (val === null) return 0
    this.store.set(key, { value: val, expiresAt: Date.now() + seconds * 1000 })
    return 1
  }

  async keys(pattern: string) {
    const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return [...this.store.keys()].filter((k) => re.test(k))
  }
}

let client: RedisLike | null = null

export async function getRedis(): Promise<RedisLike> {
  if (client) return client
  const url = getEnv().REDIS_URL
  if (url) {
    try {
      const { default: IORedis } = await import('ioredis')
      const redis = new IORedis(url)
      client = {
        get: (k) => redis.get(k),
        set: (k, v, mode, ttl) => redis.set(k, v, mode as 'EX', ttl),
        del: (...keys) => redis.del(...keys),
        incr: (k) => redis.incr(k),
        expire: (k, s) => redis.expire(k, s),
        keys: (p) => redis.keys(p),
      }
      logger.info('Redis connected')
      return client
    } catch (err) {
      logger.warn({ err }, 'Redis unavailable, using in-memory fallback')
    }
  }
  client = new MemoryRedis()
  return client
}
