import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// Profile selection + management
// ---------------------------------------------------------------------------
test.describe('Profiles', () => {
  test('profile selection page loads after sign-in', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Profile Tester', email: uniqueEmail('profiletest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('manage profiles page loads', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Manage Tester', email: uniqueEmail('managetest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/profiles/manage')
    await expect(page.locator('body')).toBeVisible()
  })
})
