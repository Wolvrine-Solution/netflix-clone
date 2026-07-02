import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
test.describe('Login', () => {
  test('login page renders email and password inputs', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // NextAuth either renders the inline error on /login, or (depending on
    // provider/DB config) redirects to its own /api/auth/error page — both
    // mean the bad credentials were correctly rejected.
    await page.waitForLoadState('networkidle').catch(() => null)
    const hasInlineError = await page
      .getByText(/invalid email or password/i)
      .isVisible()
      .catch(() => false)
    expect(hasInlineError || page.url().includes('/api/auth/error')).toBe(true)
  })
})
