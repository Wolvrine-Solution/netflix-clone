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
  Query,
  UseGuards,
} from '@nestjs/common'
import { z } from 'zod'
import {
  and,
  count,
  eq,
  ilike,
  inArray,
  or,
  profile,
  subscription,
  user,
  type Database,
} from '@netflix/db'
import { AdminGuard } from '../../../common/admin.guard'
import { AppError } from '../../../common/app-error'
import { DB } from '../../../common/tokens'
import { ZodPipe } from '../../../common/zod.pipe'
import { notFound, pageParams, pgErrorCode } from '../admin-utils'

const updateSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  isSuspended: z.boolean().optional(),
  name: z.string().optional(),
})
const subscriptionSchema = z.object({
  plan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  status: z.enum(['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING']),
})

/** Never expose credentials/secrets through the admin API. */
function sanitize<T extends { hashedPassword?: string | null; mfaSecret?: string | null }>(u: T) {
  const { hashedPassword: _h, mfaSecret: _m, ...safe } = u
  return safe
}

@Controller('api/admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    const { page, limit } = pageParams(query, 100)
    const q = String(query['q'] ?? '').trim()
    const where = q ? or(ilike(user.email, `%${q}%`), ilike(user.name, `%${q}%`)) : undefined

    const [users, [totals]] = await Promise.all([
      this.db.query.user.findMany({
        where: q ? (u) => or(ilike(u.email, `%${q}%`), ilike(u.name, `%${q}%`)) : undefined,
        limit,
        offset: (page - 1) * limit,
        orderBy: (u, { desc: d }) => d(u.createdAt),
        with: { subscription: true },
      }),
      this.db.select({ total: count() }).from(user).where(where),
    ])

    const ids = users.map((u) => u.id)
    const counts = ids.length
      ? await this.db
          .select({ userId: profile.userId, n: count() })
          .from(profile)
          .where(inArray(profile.userId, ids))
          .groupBy(profile.userId)
      : []
    const total = totals?.total ?? 0

    return {
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        role: u.role,
        isSuspended: u.isSuspended,
        createdAt: u.createdAt,
        profileCount: counts.find((c) => c.userId === u.id)?.n ?? 0,
        subscription: u.subscription
          ? { plan: u.subscription.plan, status: u.subscription.status }
          : null,
      })),
      page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
    }
  }

  @Get(':id')
  async byId(@Param('id') id: string) {
    const u = await this.db.query.user.findFirst({
      where: eq(user.id, id),
      with: { subscription: true, profiles: true },
    })
    if (!u) notFound('User')
    return { data: { ...sanitize(u), _count: { profiles: u.profiles.length } } }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ZodPipe(updateSchema)) body: z.infer<typeof updateSchema>
  ) {
    const [u] = await this.db
      .update(user)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning()
    if (!u) notFound('User')
    return { data: sanitize(u) }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.db.delete(user).where(eq(user.id, id)).returning({ id: user.id })
      if (!deleted.length) notFound('User')
    } catch (err) {
      if (pgErrorCode(err) === '23503') {
        throw new AppError(409, 'User has records that block deletion (e.g. admin audit log)')
      }
      throw err
    }
    return { message: 'User deleted' }
  }

  @Post(':id/subscription')
  @HttpCode(200)
  async setSubscription(
    @Param('id') id: string,
    @Body(new ZodPipe(subscriptionSchema)) body: z.infer<typeof subscriptionSchema>
  ) {
    const [u] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, id)))
    if (!u) notFound('User')
    const [sub] = await this.db
      .insert(subscription)
      .values({ userId: id, ...body })
      .onConflictDoUpdate({ target: subscription.userId, set: body })
      .returning()
    return { data: sub }
  }
}
