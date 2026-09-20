import { defineConfig, devices } from '@playwright/test';

/**
 * Live suite: the real Cliniva UI against the real Cliniva and CloudSuite backends (no mock data).
 * Needs the stack from integration-verify/README.md plus `npm run start:local` (port 4201).
 */
export default defineConfig({
  testDir: './e2e-live',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120000,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4201',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
