import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// My List
// ---------------------------------------------------------------------------
test.describe('My List', () => {
  test('my list page loads after sign-in', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'MyList Tester', email: uniqueEmail('mylisttest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/my-list')
    await expect(page.locator('body')).toBeVisible()
  })
})
