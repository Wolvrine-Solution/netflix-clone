import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { AppError } from './errorHandler'

export interface AuthRequest extends Request {
  userId?: string
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new AppError(401, 'Unauthorized')
    const payload = await verifyAccessToken(token)
    const sub = payload.sub
    if (!sub) throw new AppError(401, 'Unauthorized')
    req.userId = sub
    next()
  } catch {
    next(new AppError(401, 'Unauthorized'))
  }
}
