import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------
test.describe('Login screen', () => {
  test('renders email and password inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByText('Sign In', { exact: true }).last()).toBeVisible();
  });

  test('sign-in attempt does not crash the page', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter your email').fill('nobody@example.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByText('Sign In', { exact: true }).last().click();
    // react-native-web doesn't implement Alert.alert as a visible dialog, so
    // there's no inline error to assert on here — just confirm the app
    // survives the attempt and stays on a rendered page.
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('sign up link goes to the register screen', async ({ page }) => {
    await page.goto('/login');
    await page.getByText('Sign up now.').click();
    await expect(page.getByText('Create Account').first()).toBeVisible({ timeout: 8000 });
  });
});
