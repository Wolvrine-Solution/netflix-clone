import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// Account settings
// ---------------------------------------------------------------------------
test.describe('Settings', () => {
  test('settings page loads after sign-in', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Settings Tester', email: uniqueEmail('settingstest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/settings')
    await expect(page.locator('body')).toBeVisible()
  })
})
