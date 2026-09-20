import { defineConfig, devices } from '@playwright/test';

/** Post-deploy smoke test against staging (BASE_URL). */
export default defineConfig({
  testDir: './e2e-smoke',
  timeout: 60000,
  retries: 1,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL, ignoreHTTPSErrors: true, screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
