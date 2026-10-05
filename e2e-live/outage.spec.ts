import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { registerPatient, signInAsNewAdmin, signInWithOtp } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';
const CLOUDSUITE_CONTAINER = process.env.CLOUDSUITE_CONTAINER || 'codeatcloud-local-cloudsuite-1';
const CLINIVA_CONTAINER = process.env.CLINIVA_CONTAINER || 'codeatcloud-local-cliniva-1';
const CLOUDSUITE_HEALTH = process.env.CLOUDSUITE_HEALTH || 'http://localhost:8081/actuator/health';

/**
 * The platform being down must not stop patient care. CloudSuite is stopped and Cliniva restarted (so nothing is left
 * in its caches): staff still sign in, register patients and work the beds from Cliniva's own copy of the licence,
 * with no screen waiting on the dead platform. Local Docker only; CloudSuite is started again afterwards.
 */
test('with CloudSuite down, a clinic keeps working from its own copy of the licence @desktop', async ({ page, request }) => {
  test.skip(!!process.env.SKIP_OUTAGE, 'needs the local Docker containers');
  test.setTimeout(300000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const stamp = Date.now().toString().slice(-6);

  try {
    execSync(`docker stop ${CLOUDSUITE_CONTAINER}`, { stdio: 'ignore' });
    execSync(`docker restart ${CLINIVA_CONTAINER}`, { stdio: 'ignore' });
    await expect
      .poll(async () => (await request.get(CLINIVA.replace('/api/v1', '/actuator/health')).catch(() => null))?.ok() ?? false,
        { timeout: 180000, intervals: [3000], message: 'Cliniva is back up' })
      .toBe(true);

    // A fresh sign-in, a new patient and the bed board, all without the platform.
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    const started = Date.now();
    await signInWithOtp(page, request, admin.adminEmail);
    await page.goto(`${admin.hospitalCode}/patients`);
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/patients`));
    await registerPatient(page, admin.hospitalCode, `Outage Patient ${stamp}`, `94${stamp}33`.slice(0, 10));
    await page.goto(`${admin.hospitalCode}/ipd`);
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/ipd$`));
    await expect(page.locator('#bed-counts, #no-wards').first()).toBeVisible({ timeout: 15000 });
    // Sign-in, registering and two screens: slow timeouts against the dead platform would take minutes.
    expect(Date.now() - started, 'no screen waits on the platform').toBeLessThan(60000);
  } finally {
    execSync(`docker start ${CLOUDSUITE_CONTAINER}`, { stdio: 'ignore' });
    // The next tests make their clinics through the platform: wait until it is back, not only started.
    await expect
      .poll(async () => (await request.get(`${CLOUDSUITE_HEALTH}`).catch(() => null))?.ok() ?? false,
        { timeout: 240000, intervals: [3000], message: 'CloudSuite is back up' })
      .toBe(true);
  }
});
