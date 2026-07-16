import Stripe from 'stripe'
import { Plan, SubStatus } from '@prisma/client'
import { prisma } from '@netflix/db'
import { getEnv } from '../../lib/env'
import { logger } from '../../lib/logger'

let stripe: Stripe | null = null

function getStripe(): Stripe | null {
  const key = getEnv().STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripe) stripe = new Stripe(key, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion })
  return stripe
}

function priceMap() {
  const env = getEnv()
  return {
    BASIC: env.STRIPE_PRICE_BASIC,
    STANDARD: env.STRIPE_PRICE_STANDARD,
    PREMIUM: env.STRIPE_PRICE_PREMIUM,
  } as Record<Plan, string | undefined>
}

export async function createCheckoutSession(userId: string, plan: Plan, successUrl: string, cancelUrl: string) {
  const s = getStripe()
  if (!s) throw new Error('Stripe not configured')

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } })
  if (!user) throw new Error('User not found')

  let customerId = user.subscription?.stripeCustomerId
  if (!customerId) {
    const customer = await s.customers.create({ email: user.email, metadata: { userId } })
    customerId = customer.id
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, plan, stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    })
  }

  const priceId = priceMap()[plan]
  if (!priceId) throw new Error(`No Stripe price configured for plan ${plan}`)

  const session = await s.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, plan },
    automatic_tax: { enabled: true },
  })

  return { url: session.url, sessionId: session.id }
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const s = getStripe()
  const secret = getEnv().STRIPE_WEBHOOK_SECRET
  if (!s || !secret) throw new Error('Stripe webhooks not configured')

  const event = s.webhooks.constructEvent(rawBody, signature, secret)

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  })
  if (existing) return { duplicate: true }

  await prisma.stripeWebhookEvent.create({ data: { stripeEventId: event.id } })

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan as Plan | undefined
      if (userId && plan) {
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: SubStatus.ACTIVE,
            stripeCustomerId: session.customer as string,
            stripeSubId: session.subscription as string,
          },
          update: {
            plan,
            status: SubStatus.ACTIVE,
            stripeSubId: session.subscription as string,
          },
        })
      }
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const local = await prisma.subscription.findFirst({
        where: { stripeSubId: sub.id },
      })
      if (local) {
        const status =
          sub.status === 'active' ? SubStatus.ACTIVE :
          sub.status === 'trialing' ? SubStatus.TRIALING :
          sub.status === 'past_due' ? SubStatus.PAST_DUE :
          SubStatus.CANCELED
        await prisma.subscription.update({
          where: { id: local.id },
          data: {
            status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
          },
        })
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const local = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      })
      if (local) {
        await prisma.subscription.update({
          where: { id: local.id },
          data: { status: SubStatus.PAST_DUE },
        })
      }
      break
    }
    default:
      logger.debug({ type: event.type }, 'Unhandled Stripe event')
  }

  return { duplicate: false }
}

export async function createPpvPurchase(userId: string, eventId: string, amountCents: number) {
  const s = getStripe()
  if (!s) throw new Error('Stripe not configured')

  const intent = await s.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata: { userId, eventId, type: 'PPV' },
  })

  await prisma.purchase.create({
    data: {
      userId,
      eventId,
      type: 'PPV',
      amountCents,
      stripePaymentIntentId: intent.id,
    },
  })

  await prisma.eventEntitlement.create({
    data: { userId, eventId },
  })

  return { clientSecret: intent.client_secret }
}
