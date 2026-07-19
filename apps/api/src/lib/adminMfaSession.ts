const SESSION_TTL_MS = 8 * 60 * 60 * 1000

const sessions = new Map<string, number>()

export function setAdminMfaSession(userId: string): void {
  sessions.set(userId, Date.now() + SESSION_TTL_MS)
}

export function hasValidAdminMfaSession(userId: string): boolean {
  const expiresAt = sessions.get(userId)
  if (!expiresAt) return false
  if (Date.now() > expiresAt) {
    sessions.delete(userId)
    return false
  }
  return true
}

export function clearAdminMfaSession(userId: string): void {
  sessions.delete(userId)
}

/** Test helper */
export function resetAdminMfaSessions(): void {
  sessions.clear()
}
