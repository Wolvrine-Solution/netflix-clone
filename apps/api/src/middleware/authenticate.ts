import { Request, Response, NextFunction } from 'express'
import { jwtVerify } from 'jose'
import { AppError } from './errorHandler'

const secret = new TextEncoder().encode(process.env['NEXTAUTH_SECRET'] ?? 'fallback-secret')

export interface AuthRequest extends Request {
  userId?: string
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new AppError(401, 'Unauthorized')
    const { payload } = await jwtVerify(token, secret)
    req.userId = payload['sub'] as string
    next()
  } catch {
    next(new AppError(401, 'Unauthorized'))
  }
}
