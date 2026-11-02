import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

/**
 * Idle sign-out (requirement 4). The real limit is 15 minutes; a browser run may only SHORTEN it with the
 * localStorage key cliniva.idle.limit.ms, so this one waits a few seconds: the warning shows, "Stay signed in"
 * starts the clock again, and an untouched session is signed out to the clinic's sign-in page with the reason shown.
 */
test('an unattended session warns, can be kept, and is signed out', async ({ page, request }) => {
  test.setTimeout(240000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  await expect(page).toHaveURL(new RegExp(`/${code}/dashboard`, 'i'));

  // Shorten the limit to 12 s (the warning then starts 6 s before); the clock starts from now.
  await page.evaluate(() => {
    localStorage.setItem('cliniva.idle.limit.ms', '12000');
    localStorage.setItem('cliniva.lastActivity', String(Date.now()));
  });

  // Left alone: the warning appears, and "Stay signed in" starts the clock again.
  await expect(page.locator('#idle-warning')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#idle-warning')).toContainText(/signing out in \d+ seconds/);
  await page.locator('#idle-stay').click();
  await expect(page.locator('#idle-warning')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/${code}/dashboard`, 'i'));

  // Left alone again: signed out to the clinic's sign-in page, with the reason.
  await expect(page).toHaveURL(/\/login(\?reason=idle)?$/, { timeout: 40000 });
  await expect(page.locator('#signed-out-idle')).toBeVisible();

  // The session is really gone: a clinic screen sends the visitor back to sign in.
  await page.goto(`${code}/patients`);
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
});
