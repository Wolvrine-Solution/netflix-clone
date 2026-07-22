import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Registration screen
// ---------------------------------------------------------------------------
test.describe('Registration screen', () => {
  test('renders name, email, and password inputs', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByPlaceholder('Your name')).toBeVisible({ timeout: 15000 })
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('At least 8 characters')).toBeVisible()
  })

  test('submitting does not crash the page', async ({ page }) => {
    await page.goto('/register')
    await page.getByPlaceholder('Your name').fill('Test Viewer')
    await page.getByPlaceholder('Enter your email').fill(`viewer.${Date.now()}@test.com`)
    await page.getByPlaceholder('At least 8 characters').fill('password123')
    await page.getByText('Create Account', { exact: true }).last().click()
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
  })
})
