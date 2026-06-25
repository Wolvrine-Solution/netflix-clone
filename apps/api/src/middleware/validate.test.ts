import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validate } from './validate'
import { AppError } from './errorHandler'
import { mockRes, mockNext } from '../__tests__/testUtils'
import type { Request } from 'express'

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
})

describe('validate middleware', () => {
  it('passes through and replaces req.body with parsed data on success', () => {
    const req = { body: { name: 'Alice', age: 30 } } as unknown as Request
    const res = mockRes()
    const next = mockNext()

    validate(schema)(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(req.body).toEqual({ name: 'Alice', age: 30 })
  })

  it('rejects with 400 AppError when a required field is missing', () => {
    const req = { body: { age: 30 } } as unknown as Request
    const res = mockRes()
    const next = mockNext()

    validate(schema)(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err).toBeInstanceOf(AppError)
    expect(err.statusCode).toBe(400)
    expect(err.message).toMatch(/name/)
  })

  it('rejects with 400 AppError when a field has the wrong type', () => {
    const req = { body: { name: 'Alice', age: 'thirty' } } as unknown as Request
    const res = mockRes()
    const next = mockNext()

    validate(schema)(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err.statusCode).toBe(400)
    expect(err.message).toMatch(/age/)
  })

  it('validates req.query when source is "query"', () => {
    const querySchema = z.object({ page: z.string() })
    const req = { query: {} } as unknown as Request
    const res = mockRes()
    const next = mockNext()

    validate(querySchema, 'query')(req, res, next)

    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as AppError
    expect(err.statusCode).toBe(400)
    expect(err.message).toMatch(/page/)
  })

  it('strips unknown behavior is not applied — only declared fields survive via parsed data', () => {
    const req = { body: { name: 'Bob', extra: 'ignored' } } as unknown as Request
    const res = mockRes()
    const next = mockNext()

    validate(schema)(req, res, next)

    expect(req.body).toEqual({ name: 'Bob' })
  })
})
