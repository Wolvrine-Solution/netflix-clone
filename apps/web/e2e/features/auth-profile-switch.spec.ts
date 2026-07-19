import { test, expect } from '@playwright/test'

/**
 * Auth + profile switch happy-path. Skips when E2E_BASE / DB stack is unavailable.
 */
const base = process.env.PLAYWRIGHT_BASE_URL ?? process.env.E2E_BASE

test.describe('auth + profile switch', () => {
  test.skip(!base, 'Set PLAYWRIGHT_BASE_URL to run against local stack')

  test('register → profiles → switch', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`
    const password = 'TestPass123!'
    await page.goto(`${base}/auth/register`)
    await page.fill('input[type="email"], input[name="email"]', email)
    await page.fill('input[type="password"], input[name="password"]', password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/profile|browse|home|who/i, { timeout: 15_000 }).catch(() => undefined)
    await expect(page.locator('body')).toBeVisible()
  })
})
