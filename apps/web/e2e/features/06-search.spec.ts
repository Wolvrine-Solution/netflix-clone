import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
test.describe('Search', () => {
  test('search page loads after sign-in', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Search Tester', email: uniqueEmail('searchtest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/search')
    await expect(page.locator('body')).toBeVisible()
  })
})
