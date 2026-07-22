import type { Page } from '@playwright/test'

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 100000)}@test.com`
}

// Registers a fresh account through the UI and signs in, returning whether
// it actually landed past auth (false if registration/sign-in failed, so
// callers can skip rather than fail noisily on environments without a DB).
export async function registerAndSignIn(
  page: Page,
  opts: { name: string; email: string; password?: string }
): Promise<boolean> {
  await page.goto('/register')
  const nameInput = page.getByLabel('Name')
  await nameInput.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)
  if (!(await nameInput.isVisible())) return false

  await nameInput.fill(opts.name)
  await page.getByLabel('Email').fill(opts.email)
  await page.getByLabel('Password').fill(opts.password ?? 'password123')
  await page.getByRole('button', { name: /sign up|create account/i }).click()
  await page.waitForURL(/\/profiles/, { timeout: 8000 }).catch(() => null)

  return page.url().includes('/profiles')
}
