import { Request, Response, NextFunction } from 'express'
import { prisma } from '@netflix/db'
import { AuthRequest } from './authenticate'

export interface KidFilterRequest extends AuthRequest {
  isKidProfile?: boolean
}

export async function resolveKidProfile(req: KidFilterRequest, _res: Response, next: NextFunction) {
  try {
    const profileId = (req.query['profileId'] as string) ?? req.headers['x-profile-id']
    const isKidParam = req.query['isKid'] === 'true'

    if (profileId && req.userId) {
      const profile = await prisma.profile.findFirst({
        where: { id: profileId as string, userId: req.userId },
      })
      if (profile) req.isKidProfile = profile.isKid
    } else if (isKidParam) {
      req.isKidProfile = true
    }

    next()
  } catch {
    next()
  }
}
