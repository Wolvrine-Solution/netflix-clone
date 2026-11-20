import { Controller, Get, HttpCode, Inject, ServiceUnavailableException } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { pingDb } from '@netflix/db'
import { PinoLogger } from 'nestjs-pino'

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {}

  @Get('health')
  health() {
    return { status: 'ok' }
  }

  @Get('ready')
  @HttpCode(200)
  async ready() {
    try {
      await pingDb()
      return { status: 'ready', database: 'connected' }
    } catch (err) {
      this.logger.error({ err }, 'Readiness check failed')
      throw new ServiceUnavailableException({ status: 'not_ready', database: 'disconnected' })
    }
  }
}
