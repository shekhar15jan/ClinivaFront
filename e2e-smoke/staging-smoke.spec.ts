import { expect, test } from '@playwright/test';

/**
 * Runs against the deployed staging site after every deploy. It only checks what needs no account:
 * the app loads, the sign-in screen renders, and the browser reports no blocked requests. Signing in
 * needs a real OTP, which is covered by the live suite (e2e-live) against a local stack.
 */
test.describe('Staging smoke', () => {
  test('the sign-in screen loads without script or policy errors', async ({ page }) => {
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && /Content Security Policy|Refused to/.test(m.text())) problems.push(m.text());
    });

    await page.goto('login');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a clinic address that does not exist ends on a sign-in screen, not a blank page', async ({ page }) => {
    await page.goto('no-such-clinic-zz/dashboard');
    await expect(page.locator('input[type="email"], button:has-text("Send OTP")').first()).toBeVisible({ timeout: 20000 });
  });
});
