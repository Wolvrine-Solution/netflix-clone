import { Router } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { adminOnly } from '../../middleware/adminOnly'
import { validate } from '../../middleware/validate'
import {
  recordConsent,
  createDsarRequest,
  processDsarExport,
  processDsarDelete,
  createDmcaTakedown,
} from '../../modules/compliance/service'
import { prisma } from '@netflix/db'
import { AppError } from '../../middleware/errorHandler'

export const complianceRouter = Router()

complianceRouter.post(
  '/consent',
  authenticate,
  validate({
    body: z.object({ consentType: z.string(), granted: z.boolean() }),
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { consentType, granted } = req.body as { consentType: string; granted: boolean }
      const record = await recordConsent(
        req.userId!,
        consentType,
        granted,
        req.ip
      )
      res.json({ data: record })
    } catch (err) {
      next(err)
    }
  }
)

complianceRouter.post(
  '/dsar',
  authenticate,
  validate({ body: z.object({ type: z.enum(['EXPORT', 'DELETE']) }) }),
  async (req: AuthRequest, res, next) => {
    try {
      const { type } = req.body as { type: 'EXPORT' | 'DELETE' }
      const request = await createDsarRequest(req.userId!, type)
      res.status(202).json({ data: request })
    } catch (err) {
      next(err)
    }
  }
)

complianceRouter.post(
  '/dsar/:requestId/process',
  authenticate,
  adminOnly,
  async (req, res, next) => {
    try {
      const request = await prisma.dataSubjectRequest.findUnique({
        where: { id: req.params['requestId'] },
      })
      if (!request) throw new AppError(404, 'Request not found')

      if (request.type === 'EXPORT') {
        const data = await processDsarExport(request.id)
        return res.json({ data })
      }
      await processDsarDelete(request.id)
      return res.json({ data: { deleted: true } })
    } catch (err) {
      next(err)
    }
  }
)

complianceRouter.post(
  '/dmca',
  validate({
    body: z.object({
      reporterEmail: z.string().email(),
      details: z.string().min(10),
      contentId: z.string().optional(),
    }),
  }),
  async (req, res, next) => {
    try {
      const { reporterEmail, details, contentId } = req.body as {
        reporterEmail: string
        details: string
        contentId?: string
      }
      const takedown = await createDmcaTakedown(reporterEmail, details, contentId)
      res.status(201).json({ data: takedown })
    } catch (err) {
      next(err)
    }
  }
)

complianceRouter.get('/dmca', authenticate, adminOnly, async (_req, res, next) => {
  try {
    const items = await prisma.dmcaTakedown.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ data: items })
  } catch (err) {
    next(err)
  }
})
