import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Mirrors the schema in ../route.ts. Kept inline because the route module
// imports `next/server` and `@netflix/db`, which require a server runtime
// to load; the validation rules themselves are pure and worth locking down.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

describe('register schema validation', () => {
  it('accepts a valid payload', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: 'longenough',
      name: 'Jane',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = schema.safeParse({
      email: 'not-an-email',
      password: 'longenough',
      name: 'Jane',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a password shorter than 8 characters', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: 'short',
      name: 'Jane',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: 'longenough',
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing field entirely', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      password: 'longenough',
    })
    expect(result.success).toBe(false)
  })
})
