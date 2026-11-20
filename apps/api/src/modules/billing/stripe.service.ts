import { Inject, Injectable } from '@nestjs/common'
import Stripe from 'stripe'
import { ENV } from '../../common/tokens'
import type { Env } from '../../config/env'

/** Lazily-created Stripe client. `get()` returns null when STRIPE_SECRET_KEY is absent. */
@Injectable()
export class StripeService {
  private client: Stripe | null = null

  constructor(@Inject(ENV) private readonly env: Env) {}

  get(): Stripe | null {
    const key = this.env.STRIPE_SECRET_KEY
    if (!key) return null
    this.client ??= new Stripe(key, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion })
    return this.client
  }

  webhookSecret(): string | undefined {
    return this.env.STRIPE_WEBHOOK_SECRET
  }

  priceFor(plan: 'BASIC' | 'STANDARD' | 'PREMIUM'): string | undefined {
    return {
      BASIC: this.env.STRIPE_PRICE_BASIC,
      STANDARD: this.env.STRIPE_PRICE_STANDARD,
      PREMIUM: this.env.STRIPE_PRICE_PREMIUM,
    }[plan]
  }
}
