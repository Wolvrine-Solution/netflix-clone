import { Router } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../../middleware/authenticate'
import { validate } from '../../middleware/validate'
import {
  createCheckoutSession,
  createPpvPurchase,
  handleStripeWebhook,
} from '../../modules/billing/stripe'
import { Plan } from '@prisma/client'
import { prisma } from '@netflix/db'
import { AppError } from '../../middleware/errorHandler'

export const billingRouter = Router()

billingRouter.get('/subscription', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId: req.userId! } })
    res.json({ data: sub })
  } catch (err) {
    next(err)
  }
})

billingRouter.post(
  '/checkout',
  authenticate,
  validate({
    body: z.object({
      plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }),
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { plan, successUrl, cancelUrl } = req.body as {
        plan: Plan
        successUrl: string
        cancelUrl: string
      }
      const session = await createCheckoutSession(req.userId!, plan, successUrl, cancelUrl)
      res.json({ data: session })
    } catch (err) {
      next(err)
    }
  }
)

billingRouter.post(
  '/ppv',
  authenticate,
  validate({
    body: z.object({ eventId: z.string(), amountCents: z.number().int().positive() }),
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { eventId, amountCents } = req.body as { eventId: string; amountCents: number }
      const result = await createPpvPurchase(req.userId!, eventId, amountCents)
      res.json({ data: result })
    } catch (err) {
      next(err)
    }
  }
)

billingRouter.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: purchases })
  } catch (err) {
    next(err)
  }
})

export const stripeWebhookRouter = Router()

stripeWebhookRouter.post('/', async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'] as string
    if (!sig) throw new AppError(400, 'Missing stripe-signature')
    const raw = (req as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body))
    const result = await handleStripeWebhook(raw, sig)
    res.json({ received: true, ...result })
  } catch (err) {
    next(err)
  }
})
