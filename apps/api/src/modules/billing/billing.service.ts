import { Inject, Injectable } from '@nestjs/common'
import type Stripe from 'stripe'
import {
  desc,
  eq,
  eventEntitlement,
  purchase,
  stripeWebhookEvent,
  subscription,
  user,
  type Database,
  type Plan,
} from '@netflix/db'
import { AppError } from '../../common/app-error'
import { DB } from '../../common/tokens'
import { logger } from '../../lib/logger'
import { StripeService } from './stripe.service'

@Injectable()
export class BillingService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(StripeService) private readonly stripe: StripeService
  ) {}

  async getSubscription(userId: string) {
    const [sub] = await this.db.select().from(subscription).where(eq(subscription.userId, userId))
    return sub ?? null
  }

  history(userId: string) {
    return this.db
      .select()
      .from(purchase)
      .where(eq(purchase.userId, userId))
      .orderBy(desc(purchase.createdAt))
      .limit(50)
  }

  async createCheckoutSession(userId: string, plan: Plan, successUrl: string, cancelUrl: string) {
    const s = this.stripe.get()
    if (!s) throw new Error('Stripe not configured')

    const found = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
      with: { subscription: true },
    })
    if (!found) throw new Error('User not found')

    let customerId = found.subscription?.stripeCustomerId
    if (!customerId) {
      const customer = await s.customers.create({ email: found.email, metadata: { userId } })
      customerId = customer.id
      await this.db
        .insert(subscription)
        .values({ userId, plan, stripeCustomerId: customerId })
        .onConflictDoUpdate({ target: subscription.userId, set: { stripeCustomerId: customerId } })
    }

    const priceId = this.stripe.priceFor(plan)
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

  async createPpvPurchase(userId: string, eventId: string, amountCents: number) {
    const s = this.stripe.get()
    if (!s) throw new Error('Stripe not configured')

    const intent = await s.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: { userId, eventId, type: 'PPV' },
    })

    await this.db.transaction(async (tx) => {
      await tx.insert(purchase).values({
        userId,
        eventId,
        type: 'PPV',
        amountCents,
        stripePaymentIntentId: intent.id,
      })
      await tx.insert(eventEntitlement).values({ userId, eventId }).onConflictDoNothing()
    })
    return { clientSecret: intent.client_secret }
  }

  /**
   * Verify, dedupe and apply a Stripe event. The idempotency row and the state change commit
   * together, so a failed handler rolls back and Stripe's retry is processed (old code marked
   * the event done before handling it).
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    const s = this.stripe.get()
    const secret = this.stripe.webhookSecret()
    if (!s || !secret) throw new Error('Stripe webhooks not configured')

    let event: Stripe.Event
    try {
      event = s.webhooks.constructEvent(rawBody, signature, secret)
    } catch (err) {
      throw new AppError(400, `Webhook signature verification failed: ${(err as Error).message}`)
    }

    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(stripeWebhookEvent)
        .values({ stripeEventId: event.id })
        .onConflictDoNothing()
        .returning({ id: stripeWebhookEvent.id })
      if (inserted.length === 0) return { duplicate: true }

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          const userId = session.metadata?.['userId']
          const plan = session.metadata?.['plan'] as Plan | undefined
          if (userId && plan) {
            await tx
              .insert(subscription)
              .values({
                userId,
                plan,
                status: 'ACTIVE',
                stripeCustomerId: session.customer as string,
                stripeSubId: session.subscription as string,
              })
              .onConflictDoUpdate({
                target: subscription.userId,
                set: { plan, status: 'ACTIVE', stripeSubId: session.subscription as string },
              })
          }
          break
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription
          const [local] = await tx
            .select()
            .from(subscription)
            .where(eq(subscription.stripeSubId, sub.id))
            .limit(1)
          if (local) {
            const status =
              sub.status === 'active'
                ? 'ACTIVE'
                : sub.status === 'trialing'
                  ? 'TRIALING'
                  : sub.status === 'past_due'
                    ? 'PAST_DUE'
                    : 'CANCELED'
            await tx
              .update(subscription)
              .set({
                status,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                currentPeriodEnd: sub.current_period_end
                  ? new Date(sub.current_period_end * 1000)
                  : null,
              })
              .where(eq(subscription.id, local.id))
          }
          break
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice
          const [local] = await tx
            .select()
            .from(subscription)
            .where(eq(subscription.stripeCustomerId, invoice.customer as string))
            .limit(1)
          if (local) {
            await tx
              .update(subscription)
              .set({ status: 'PAST_DUE' })
              .where(eq(subscription.id, local.id))
          }
          break
        }
        default:
          logger.debug({ type: event.type }, 'Unhandled Stripe event')
      }
      return { duplicate: false }
    })
  }
}
