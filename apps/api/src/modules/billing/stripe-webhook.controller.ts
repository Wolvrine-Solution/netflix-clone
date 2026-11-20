import { Controller, Headers, HttpCode, Inject, Post, RawBodyRequest, Req } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import type { FastifyRequest } from 'fastify'
import { AppError } from '../../common/app-error'
import { BillingService } from './billing.service'

@SkipThrottle()
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Post()
  @HttpCode(200)
  async receive(
    @Req() req: RawBodyRequest<FastifyRequest>,
    @Headers('stripe-signature') signature?: string
  ) {
    if (!signature) throw new AppError(400, 'Missing stripe-signature')
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body))
    const result = await this.billing.handleWebhook(raw, signature)
    return { received: true, ...result }
  }
}
