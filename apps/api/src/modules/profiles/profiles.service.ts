import { Inject, Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'
import { and, count, eq, profile, type Database } from '@netflix/db'
import { AppError } from '../../common/app-error'
import { isUniqueViolation } from '../../common/db-errors'
import { assertProfileOwned } from '../../common/profile-access'
import { DB } from '../../common/tokens'

export interface CreateProfileInput {
  name: string
  avatarUrl: string
  isKid?: boolean
}

export interface UpdateProfileInput {
  name?: string
  avatarUrl?: string
  isKid?: boolean
}

const MAX_PROFILES = 5

@Injectable()
export class ProfilesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list(userId: string) {
    return this.db.select().from(profile).where(eq(profile.userId, userId))
  }

  async create(userId: string, input: CreateProfileInput) {
    const [row] = await this.db
      .select({ total: count() })
      .from(profile)
      .where(eq(profile.userId, userId))
    if ((row?.total ?? 0) >= MAX_PROFILES) throw new AppError(400, 'Maximum 5 profiles allowed')
    try {
      const [created] = await this.db
        .insert(profile)
        .values({
          name: input.name,
          avatarUrl: input.avatarUrl,
          isKid: input.isKid ?? false,
          userId,
        })
        .returning()
      return created!
    } catch (e) {
      if (isUniqueViolation(e)) throw new AppError(409, 'A profile with this name already exists')
      throw e
    }
  }

  private async findOwned(profileId: string, userId: string) {
    const [p] = await this.db
      .select()
      .from(profile)
      .where(and(eq(profile.id, profileId), eq(profile.userId, userId)))
      .limit(1)
    if (!p) throw new AppError(404, 'Profile not found')
    return p
  }

  async update(userId: string, profileId: string, input: UpdateProfileInput) {
    const existing = await this.findOwned(profileId, userId)
    const patch = {
      ...(input.name && { name: input.name }),
      ...(input.avatarUrl && { avatarUrl: input.avatarUrl }),
      ...(input.isKid !== undefined && { isKid: input.isKid }),
    }
    if (Object.keys(patch).length === 0) return existing
    const [updated] = await this.db
      .update(profile)
      .set(patch)
      .where(eq(profile.id, profileId))
      .returning()
    return updated!
  }

  async remove(userId: string, profileId: string) {
    await this.findOwned(profileId, userId)
    await this.db.delete(profile).where(eq(profile.id, profileId))
  }

  async setPin(userId: string, profileId: string, pin: string) {
    const p = await assertProfileOwned(this.db, profileId, userId)
    await this.db
      .update(profile)
      .set({ pinHash: await hash(pin, 10) })
      .where(eq(profile.id, p.id))
    return { id: p.id, hasPin: true }
  }

  async clearPin(userId: string, profileId: string) {
    const p = await assertProfileOwned(this.db, profileId, userId)
    await this.db.update(profile).set({ pinHash: null }).where(eq(profile.id, p.id))
    return { id: p.id, hasPin: false }
  }

  async verifyPin(userId: string, profileId: string, pin: string) {
    const p = await assertProfileOwned(this.db, profileId, userId)
    if (!p.pinHash) throw new AppError(400, 'Profile has no PIN set')
    if (!(await compare(pin, p.pinHash))) throw new AppError(401, 'Invalid PIN')
    return { verified: true }
  }

  async access(userId: string, profileId: string, pin: string | undefined) {
    const p = await assertProfileOwned(this.db, profileId, userId)
    if (p.pinHash) {
      if (!pin) throw new AppError(401, 'PIN required')
      if (!(await compare(pin, p.pinHash))) throw new AppError(401, 'Invalid PIN')
    }
    return { accessGranted: true }
  }
}
