import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '@netflix/db'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { adminOnlyBase } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import { AppError } from '../../middleware/errorHandler'
import { generateTotpSecret, getTotpAuthUrl, verifyTotpCode } from '../../lib/totp'
import { setAdminMfaSession, clearAdminMfaSession } from '../../lib/adminMfaSession'

export const adminMfaRouter = Router()
adminMfaRouter.use(authenticate, adminOnlyBase)

const totpCodeSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/),
})

adminMfaRouter.post('/setup', async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { email: true, mfaEnabled: true },
    })
    if (!user) throw new AppError(404, 'User not found')
    if (user.mfaEnabled) throw new AppError(400, 'MFA is already enabled')

    const secret = generateTotpSecret()
    await prisma.user.update({
      where: { id: req.userId! },
      data: { mfaSecret: secret },
    })

    res.json({
      data: {
        secret,
        otpauthUrl: getTotpAuthUrl(user.email, secret),
      },
    })
  } catch (err) {
    next(err)
  }
})

adminMfaRouter.post('/enable', validate(totpCodeSchema), async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body as z.infer<typeof totpCodeSchema>
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { mfaSecret: true, mfaEnabled: true },
    })
    if (!user?.mfaSecret) throw new AppError(400, 'Run MFA setup first')
    if (user.mfaEnabled) throw new AppError(400, 'MFA is already enabled')
    if (!verifyTotpCode(user.mfaSecret, code)) throw new AppError(401, 'Invalid TOTP code')

    await prisma.user.update({
      where: { id: req.userId! },
      data: { mfaEnabled: true },
    })
    setAdminMfaSession(req.userId!)

    res.json({ data: { enabled: true } })
  } catch (err) {
    next(err)
  }
})

adminMfaRouter.post('/verify', validate(totpCodeSchema), async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body as z.infer<typeof totpCodeSchema>
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { mfaSecret: true, mfaEnabled: true },
    })
    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new AppError(400, 'MFA is not enabled for this account')
    }
    if (!verifyTotpCode(user.mfaSecret, code)) throw new AppError(401, 'Invalid TOTP code')

    setAdminMfaSession(req.userId!)
    res.json({ data: { verified: true } })
  } catch (err) {
    next(err)
  }
})

adminMfaRouter.post('/disable', validate(totpCodeSchema), async (req: AuthRequest, res, next) => {
  try {
    const { code } = req.body as z.infer<typeof totpCodeSchema>
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { mfaSecret: true, mfaEnabled: true },
    })
    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new AppError(400, 'MFA is not enabled for this account')
    }
    if (!verifyTotpCode(user.mfaSecret, code)) throw new AppError(401, 'Invalid TOTP code')

    await prisma.user.update({
      where: { id: req.userId! },
      data: { mfaEnabled: false, mfaSecret: null },
    })
    clearAdminMfaSession(req.userId!)

    res.json({ data: { disabled: true } })
  } catch (err) {
    next(err)
  }
})
