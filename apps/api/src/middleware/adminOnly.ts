import { Response, NextFunction } from 'express'
import { prisma } from '@netflix/db'
import { AuthRequest } from './authenticate'
import { AppError } from './errorHandler'

export async function adminOnly(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw new AppError(401, 'Unauthorized')
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true, isSuspended: true } })
    if (!user || user.role !== 'ADMIN') throw new AppError(403, 'Forbidden — admin access required')
    if (user.isSuspended) throw new AppError(403, 'Account suspended')
    next()
  } catch (err) {
    next(err)
  }
}
