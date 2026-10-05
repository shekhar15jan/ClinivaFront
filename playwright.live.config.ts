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
    // SLOWMO=600 (milliseconds per action) with --headed, to watch a run.
    launchOptions: { slowMo: Number(process.env.SLOWMO || 0) },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  // DEVICE='Pixel 7' (or any Playwright device name) runs the journeys on that screen size, leaving out the ones
  // tagged @desktop (they drive the desktop tables and sidebar on purpose). phone.spec.ts covers the phone layout
  // in every run.
  grepInvert: process.env.DEVICE ? /@desktop/ : undefined,
  projects: [{ name: 'chromium', use: { ...devices[process.env.DEVICE || 'Desktop Chrome'] } }],
});
