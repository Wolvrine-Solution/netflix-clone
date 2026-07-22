import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Root — unauthenticated visits bounce to the login screen
// ---------------------------------------------------------------------------
test.describe('Root', () => {
  test('unauthenticated visit redirects to sign in', async ({ page }) => {
    await page.goto('/')
    // The index route shows a spinner while it checks AsyncStorage for a
    // token, then calls router.replace('/login') client-side (no real HTTP
    // redirect) — wait for that navigation before asserting on content.
    await page.waitForURL(/\/login/, { timeout: 15000 })
    await expect(page.getByText('Sign In').first()).toBeVisible()
    await expect(page.getByText('NETFLIX').first()).toBeVisible()
  })
})
