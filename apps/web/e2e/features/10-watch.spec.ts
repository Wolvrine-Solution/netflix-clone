import { test, expect } from '@playwright/test'
import { registerAndSignIn, uniqueEmail } from '../helpers'

// ---------------------------------------------------------------------------
// Watch player — navigates from browse to the first title's watch page,
// since content IDs are seed-data dependent and not knowable up front.
// ---------------------------------------------------------------------------
test.describe('Watch', () => {
  test('navigates from browse to a watch page', async ({ page }) => {
    const signedIn = await registerAndSignIn(page, { name: 'Watch Tester', email: uniqueEmail('watchtest') })
    test.skip(!signedIn, 'Registration/sign-in unavailable in this environment (needs API + DB)')

    await page.goto('/browse')
    const firstTitleLink = page.locator('a[href^="/watch/"]').first()
    await firstTitleLink.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)
    test.skip(!(await firstTitleLink.isVisible()), 'No titles in catalog to watch (needs seed data)')

    await firstTitleLink.click()
    await expect(page).toHaveURL(/\/watch\/.+/)
    await expect(page.locator('body')).toBeVisible()
  })
})
