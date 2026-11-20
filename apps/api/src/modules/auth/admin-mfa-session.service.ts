import { Injectable } from '@nestjs/common'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000

/**
 * Admin MFA sessions. In-process Map: correct for a single API instance only.
 * LEFTOVER: move to Valkey before running more than one API replica.
 */
@Injectable()
export class AdminMfaSessionService {
  private readonly sessions = new Map<string, number>()

  set(userId: string): void {
    this.sessions.set(userId, Date.now() + SESSION_TTL_MS)
  }

  has(userId: string): boolean {
    const expiresAt = this.sessions.get(userId)
    if (!expiresAt) return false
    if (Date.now() > expiresAt) {
      this.sessions.delete(userId)
      return false
    }
    return true
  }

  clear(userId: string): void {
    this.sessions.delete(userId)
  }
}
