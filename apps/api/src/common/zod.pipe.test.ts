import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { AppError } from './app-error'
import { ZodPipe } from './zod.pipe'

const pipe = new ZodPipe(z.object({ email: z.string().email(), age: z.number().int().min(0) }))

describe('ZodPipe', () => {
  it('returns parsed data (including coercions and stripped unknown keys)', () => {
    expect(pipe.transform({ email: 'a@b.co', age: 3, extra: 1 })).toEqual({
      email: 'a@b.co',
      age: 3,
    })
  })

  it('throws AppError 400 listing every failing field', () => {
    try {
      pipe.transform({ email: 'nope', age: -1 })
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(AppError)
      const err = e as AppError
      expect(err.statusCode).toBe(400)
      expect(err.message).toMatch(/^Validation error: /)
      expect(err.message).toContain('email')
      expect(err.message).toContain('age')
    }
  })
})
