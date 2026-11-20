import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { AppRequest } from './request-context'

/** The authenticated user id (set by JwtAuthGuard / OptionalAuthGuard). */
export const UserId = createParamDecorator((_d: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AppRequest>().userId
})

/** Whether the active profile is a kid profile (set by KidProfileGuard). */
export const IsKid = createParamDecorator((_d: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<AppRequest>().isKidProfile === true
})
