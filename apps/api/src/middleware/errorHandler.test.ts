import { describe, it, expect, vi } from 'vitest'
import { AppError, errorHandler } from './errorHandler'
import { mockRes } from '../__tests__/testUtils'
import type { Request, NextFunction } from 'express'

describe('errorHandler middleware', () => {
  it('responds with the AppError statusCode and message for known errors', () => {
    const err = new AppError(404, 'Profile not found')
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction

    errorHandler(err, {} as Request, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      error: 'AppError',
      message: 'Profile not found',
      statusCode: 404,
    })
  })

  it('falls back to 500 InternalServerError for unrecognized errors', () => {
    const err = new Error('something exploded')
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(err, {} as Request, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      error: 'InternalServerError',
      message: 'Something went wrong',
      statusCode: 500,
    })
    consoleSpy.mockRestore()
  })

  it('does not leak the original error message for unrecognized errors', () => {
    const err = new Error('leaked secret database connection string')
    const res = mockRes()
    const next = vi.fn() as unknown as NextFunction
    vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(err, {} as Request, res, next)

    const jsonCall = (res.json as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as { message: string }
    expect(jsonCall.message).not.toContain('leaked secret')
  })
})
