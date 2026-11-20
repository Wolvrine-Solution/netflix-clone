import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { z } from 'zod'
import { AppError } from '../../common/app-error'
import { AdminGuard } from '../../common/admin.guard'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import type { AppRequest } from '../../common/request-context'
import { ZodPipe } from '../../common/zod.pipe'
import { ComplianceService } from './compliance.service'

const ConsentBody = z.object({ consentType: z.string(), granted: z.boolean() })
const DsarBody = z.object({ type: z.enum(['EXPORT', 'DELETE']) })
const DmcaBody = z.object({
  reporterEmail: z.string().email(),
  details: z.string().min(10),
  contentId: z.string().optional(),
})

@Controller('api/v1/compliance')
export class ComplianceController {
  constructor(@Inject(ComplianceService) private readonly compliance: ComplianceService) {}

  @Post('consent')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async consent(
    @UserId() userId: string,
    @Req() req: AppRequest,
    @Body(new ZodPipe(ConsentBody)) body: z.infer<typeof ConsentBody>
  ) {
    return {
      data: await this.compliance.recordConsent(userId, body.consentType, body.granted, req.ip),
    }
  }

  @Post('dsar')
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  async dsar(
    @UserId() userId: string,
    @Body(new ZodPipe(DsarBody)) body: z.infer<typeof DsarBody>
  ) {
    return { data: await this.compliance.createDsarRequest(userId, body.type) }
  }

  @Post('dsar/:requestId/process')
  @HttpCode(200)
  @UseGuards(AdminGuard)
  async processDsar(@Param('requestId') requestId: string) {
    const request = await this.compliance.findDsar(requestId)
    if (!request) throw new AppError(404, 'Request not found')
    if (request.type === 'EXPORT') {
      return { data: await this.compliance.processDsarExport(request.id) }
    }
    await this.compliance.processDsarDelete(request.id)
    return { data: { deleted: true } }
  }

  @Post('dmca')
  @HttpCode(201)
  async dmca(@Body(new ZodPipe(DmcaBody)) body: z.infer<typeof DmcaBody>) {
    return {
      data: await this.compliance.createDmcaTakedown(
        body.reporterEmail,
        body.details,
        body.contentId
      ),
    }
  }

  @Get('dmca')
  @UseGuards(AdminGuard)
  async listDmca() {
    return { data: await this.compliance.listDmca() }
  }
}
