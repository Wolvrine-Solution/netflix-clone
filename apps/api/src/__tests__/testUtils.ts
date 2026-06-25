import { vi } from 'vitest'
import type { Response, NextFunction } from 'express'

/** Minimal mock of the Prisma client surface used across routes/middleware. */
export function createPrismaMock() {
  return {
    user: { findUnique: vi.fn() },
    profile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    myListItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    content: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    genre: { upsert: vi.fn() },
    notification: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    videoFile: { create: vi.fn(), updateMany: vi.fn(), delete: vi.fn() },
    season: { create: vi.fn() },
    episode: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    adminLog: { create: vi.fn() },
  }
}

export function mockRes(): Response {
  const res: Partial<Response> = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

export function mockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction
}
