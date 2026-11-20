import { Body, Controller, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common'
import { z } from 'zod'
import { eq, user, type Database } from '@netflix/db'
import { AdminBaseGuard } from '../../../common/admin.guard'
import { AppError } from '../../../common/app-error'
import type { AppRequest } from '../../../common/request-context'
import { DB } from '../../../common/tokens'
import { ZodPipe } from '../../../common/zod.pipe'
import { generateTotpSecret, getTotpAuthUrl, verifyTotpCode } from '../../../lib/totp'
import { AdminMfaSessionService } from '../../auth/admin-mfa-session.service'

const totpCodeSchema = z.object({ code: z.string().length(6).regex(/^\d+$/) })
type TotpBody = z.infer<typeof totpCodeSchema>

// MFA endpoints require an admin but NOT an existing MFA session (they establish it).
@Controller('api/admin/mfa')
@UseGuards(AdminBaseGuard)
export class AdminMfaController {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(AdminMfaSessionService) private readonly sessions: AdminMfaSessionService
  ) {}

  private async load(userId: string) {
    const [u] = await this.db
      .select({ email: user.email, mfaSecret: user.mfaSecret, mfaEnabled: user.mfaEnabled })
      .from(user)
      .where(eq(user.id, userId))
    return u
  }

  @Post('setup')
  @HttpCode(200)
  async setup(@Req() req: AppRequest) {
    const u = await this.load(req.userId!)
    if (!u) throw new AppError(404, 'User not found')
    if (u.mfaEnabled) throw new AppError(400, 'MFA is already enabled')

    const secret = generateTotpSecret()
    await this.db.update(user).set({ mfaSecret: secret }).where(eq(user.id, req.userId!))
    return { data: { secret, otpauthUrl: getTotpAuthUrl(u.email, secret) } }
  }

  @Post('enable')
  @HttpCode(200)
  async enable(@Req() req: AppRequest, @Body(new ZodPipe(totpCodeSchema)) body: TotpBody) {
    const u = await this.load(req.userId!)
    if (!u?.mfaSecret) throw new AppError(400, 'Run MFA setup first')
    if (u.mfaEnabled) throw new AppError(400, 'MFA is already enabled')
    if (!verifyTotpCode(u.mfaSecret, body.code)) throw new AppError(401, 'Invalid TOTP code')

    await this.db.update(user).set({ mfaEnabled: true }).where(eq(user.id, req.userId!))
    this.sessions.set(req.userId!)
    return { data: { enabled: true } }
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Req() req: AppRequest, @Body(new ZodPipe(totpCodeSchema)) body: TotpBody) {
    const u = await this.load(req.userId!)
    if (!u?.mfaEnabled || !u.mfaSecret) {
      throw new AppError(400, 'MFA is not enabled for this account')
    }
    if (!verifyTotpCode(u.mfaSecret, body.code)) throw new AppError(401, 'Invalid TOTP code')

    this.sessions.set(req.userId!)
    return { data: { verified: true } }
  }

  @Post('disable')
  @HttpCode(200)
  async disable(@Req() req: AppRequest, @Body(new ZodPipe(totpCodeSchema)) body: TotpBody) {
    const u = await this.load(req.userId!)
    if (!u?.mfaEnabled || !u.mfaSecret) {
      throw new AppError(400, 'MFA is not enabled for this account')
    }
    if (!verifyTotpCode(u.mfaSecret, body.code)) throw new AppError(401, 'Invalid TOTP code')

    await this.db
      .update(user)
      .set({ mfaEnabled: false, mfaSecret: null })
      .where(eq(user.id, req.userId!))
    this.sessions.clear(req.userId!)
    return { data: { disabled: true } }
  }
}
