import { Body, Controller, Get, HttpCode, Inject, Post, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { ZodPipe } from '../../common/zod.pipe'
import { BillingService } from './billing.service'

const CheckoutBody = z.object({
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})
const PpvBody = z.object({ eventId: z.string(), amountCents: z.number().int().positive() })

@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Get('subscription')
  async subscription(@UserId() userId: string) {
    return { data: await this.billing.getSubscription(userId) }
  }

  @Post('checkout')
  @HttpCode(200)
  async checkout(
    @UserId() userId: string,
    @Body(new ZodPipe(CheckoutBody)) body: z.infer<typeof CheckoutBody>
  ) {
    return {
      data: await this.billing.createCheckoutSession(
        userId,
        body.plan,
        body.successUrl,
        body.cancelUrl
      ),
    }
  }

  @Post('ppv')
  @HttpCode(200)
  async ppv(@UserId() userId: string, @Body(new ZodPipe(PpvBody)) body: z.infer<typeof PpvBody>) {
    return { data: await this.billing.createPpvPurchase(userId, body.eventId, body.amountCents) }
  }

  @Get('history')
  async history(@UserId() userId: string) {
    return { data: await this.billing.history(userId) }
  }
}
