import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// Subscription / billing
// ---------------------------------------------------------------------------
test.describe('Subscription', () => {
  test('subscription page loads after sign-in', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, {
      name: 'Sub Tester',
      email: uniqueEmail('subtest'),
    })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/subscription')
    await expect(page.locator('body')).toBeVisible()
  })
})
