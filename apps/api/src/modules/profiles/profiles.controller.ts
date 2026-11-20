import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { z } from 'zod'
import { JwtAuthGuard } from '../../common/auth.guard'
import { UserId } from '../../common/decorators'
import { ZodPipe } from '../../common/zod.pipe'
import {
  ProfilesService,
  type CreateProfileInput,
  type UpdateProfileInput,
} from './profiles.service'

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4–6 digits'),
})
/** Express parsed a missing body to {}; Fastify leaves it undefined. */
const orEmpty = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => v ?? {}, schema) as unknown as z.ZodType<z.infer<T>>

const createProfileSchema = z.object({
  name: z.string().trim().min(1, 'name is required').max(50),
  avatarUrl: z.string().min(1, 'avatarUrl is required'),
  isKid: z.boolean().optional(),
})

@Controller(['api/profiles', 'api/v1/profiles'])
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(@Inject(ProfilesService) private readonly profiles: ProfilesService) {}

  @Get()
  async list(@UserId() userId: string) {
    return { data: await this.profiles.list(userId) }
  }

  @Post()
  async create(
    @UserId() userId: string,
    @Body(new ZodPipe(createProfileSchema)) body: CreateProfileInput
  ) {
    return { data: await this.profiles.create(userId, body) }
  }

  @Put(':profileId')
  async update(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Body() body: UpdateProfileInput
  ) {
    return { data: await this.profiles.update(userId, profileId, body ?? {}) }
  }

  @Delete(':profileId')
  async remove(@UserId() userId: string, @Param('profileId') profileId: string) {
    await this.profiles.remove(userId, profileId)
    return { message: 'Profile deleted' }
  }

  @Put(':profileId/pin')
  async setPin(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Body(new ZodPipe(orEmpty(pinSchema))) body: z.infer<typeof pinSchema>
  ) {
    return { data: await this.profiles.setPin(userId, profileId, body.pin) }
  }

  @Delete(':profileId/pin')
  async clearPin(@UserId() userId: string, @Param('profileId') profileId: string) {
    return { data: await this.profiles.clearPin(userId, profileId) }
  }

  @Post(':profileId/pin/verify')
  @HttpCode(200)
  async verifyPin(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Body(new ZodPipe(orEmpty(pinSchema))) body: z.infer<typeof pinSchema>
  ) {
    return { data: await this.profiles.verifyPin(userId, profileId, body.pin) }
  }

  @Post(':profileId/access')
  @HttpCode(200)
  async access(
    @UserId() userId: string,
    @Param('profileId') profileId: string,
    @Body(new ZodPipe(orEmpty(pinSchema.partial()))) body: { pin?: string }
  ) {
    return { data: await this.profiles.access(userId, profileId, body.pin) }
  }
}
