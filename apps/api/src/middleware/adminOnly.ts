import { Response, NextFunction } from 'express'
import { prisma } from '@netflix/db'
import { AuthRequest } from './authenticate'
import { AppError } from './errorHandler'
import { hasValidAdminMfaSession } from '../lib/adminMfaSession'

async function assertActiveAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isSuspended: true, mfaEnabled: true },
  })
  if (!user || user.role !== 'ADMIN') throw new AppError(403, 'Forbidden — admin access required')
  if (user.isSuspended) throw new AppError(403, 'Account suspended')
  return user
}

export async function adminOnlyBase(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    await assertActiveAdmin(req.userId)
    next()
  } catch (err) {
    next(err)
  }
}

export async function adminOnly(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const user = await assertActiveAdmin(req.userId)
    if (user.mfaEnabled && !hasValidAdminMfaSession(req.userId)) {
      throw new AppError(403, 'MFA verification required')
    }
    next()
  } catch (err) {
    next(err)
  }
}
