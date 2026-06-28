import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// Browse (home, movies, tv)
// ---------------------------------------------------------------------------
test.describe('Browse', () => {
  test('browse page loads after sign-in', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Browse Tester', email: uniqueEmail('browsetest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/browse')
    await expect(page.locator('body')).toBeVisible()
  })

  test('movies tab loads', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Movies Tester', email: uniqueEmail('moviestest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/browse/movies')
    await expect(page.locator('body')).toBeVisible()
  })

  test('tv tab loads', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'TV Tester', email: uniqueEmail('tvtest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/browse/tv')
    await expect(page.locator('body')).toBeVisible()
  })
})
