import { defineConfig, devices } from '@playwright/test';

// Driven through expo-router's static web export: `expo export --platform
// web` produces a static site, served and exercised by Playwright at a
// phone-sized viewport. Real screens and navigation, with video, without
// needing a native emulator (Detox/Maestro territory).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8400',
    trace: 'on-first-retry',
    video: 'on',
    ...devices['Pixel 7'],
  },
  projects: [{ name: 'mobile-web', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'npm run build:web && npx --yes http-server dist -p 8400 -e html',
    url: 'http://localhost:8400',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
