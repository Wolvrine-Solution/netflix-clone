import { Body, Controller, HttpCode, Inject, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { AuthService } from './auth.service'

@Controller(['api/auth', 'api/v1/auth'])
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('signin')
  @HttpCode(200)
  signIn(@Body() body: { email?: string; password?: string }) {
    return this.auth.signIn(body?.email, body?.password)
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: { refreshToken?: string }) {
    return this.auth.refresh(body?.refreshToken)
  }

  /** Revokes the caller's own refresh tokens. (Was unauthenticated and took a userId from the body.) */
  @Post('revoke')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  revoke(@UserId() userId: string) {
    return this.auth.revokeAll(userId)
  }
}
