import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------
test.describe('Landing page', () => {
  test('loads and shows a call to action', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
