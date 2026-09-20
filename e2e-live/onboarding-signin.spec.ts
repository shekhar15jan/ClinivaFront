import { expect, test } from '@playwright/test';
import { countMails, nextMail, otpFrom, provisionTenant, temporaryPasswordFrom } from './helpers';

/**
 * The journey a new clinic administrator takes, end to end on real services:
 * an operator creates the tenant in CloudSuite; the admin receives a temporary password,
 * is made to choose a new one, signs in with an emailed code, and sees only the modules
 * their plan includes.
 */
test.describe('New clinic administrator', () => {
  test('is provisioned, must change the temporary password, signs in with OTP and sees only licensed modules', async ({ page, request }) => {
    const tenant = await provisionTenant(request, 'HMS_STARTER');
    const temporary = temporaryPasswordFrom(await nextMail(request, tenant.adminEmail, 'temporary password'));
    const chosen = `Live#${Date.now().toString().slice(-6)}Pw`;

    // 1. The generic login finds the clinic from the email address.
    await page.goto('/login');
    await page.fill('input[type="email"]', tenant.adminEmail);
    await page.locator('button[type="submit"]').first().click();
    // The clinic's own sign-in page (/<code>/login), not the generic /login we started on.
    await page.waitForURL((url) => /^\/[^/]+\/login$/.test(url.pathname), { timeout: 15000 });
    const hospitalCode = new URL(page.url()).pathname.split('/')[1];

    // 2. Asking for a sign-in code is refused until the temporary password is replaced.
    await page.locator('button:has-text("Send OTP")').click();
    await expect(page.getByText(/Password change required/i)).toBeVisible({ timeout: 15000 });
    await page.locator('#set-new-password').click();
    await expect(page).toHaveURL(new RegExp(`/${hospitalCode}/change-password$`));

    // 3. The page validates locally before calling the server, and the server checks the old password.
    await expect(page.locator('#cp-email')).toHaveValue(tenant.adminEmail);
    await page.fill('#cp-current', temporary);
    await page.fill('#cp-new', 'short');
    await page.fill('#cp-confirm', 'short');
    await page.getByRole('button', { name: 'Change Password' }).click();
    await expect(page.locator('#change-password-error')).toContainText('at least 8');
    await page.fill('#cp-new', chosen);
    await page.fill('#cp-confirm', `${chosen}x`);
    await page.getByRole('button', { name: 'Change Password' }).click();
    await expect(page.locator('#change-password-error')).toContainText('do not match');
    await page.fill('#cp-current', 'not-the-temporary-password');
    await page.fill('#cp-confirm', chosen);
    await page.getByRole('button', { name: 'Change Password' }).click();
    await expect(page.locator('#change-password-error')).not.toContainText('do not match');
    await expect(page.locator('#change-password-error')).toBeVisible();
    await page.fill('#cp-current', temporary);
    await page.getByRole('button', { name: 'Change Password' }).click();

    // 4. Back at sign-in with a confirmation; the email is remembered.
    await expect(page).toHaveURL(new RegExp(`/${hospitalCode}/login\\?passwordChanged=1`));
    await expect(page.locator('#password-changed')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toHaveValue(tenant.adminEmail);

    // 5. Now the emailed code is sent and accepted.
    const before = await countMails(request, tenant.adminEmail, 'otp');
    await page.locator('button:has-text("Send OTP")').click();
    await page.waitForURL(/\/otp$/, { timeout: 15000 });
    const otp = otpFrom(await nextMail(request, tenant.adminEmail, 'otp', before));
    const digits = page.locator('input.otp-digit');
    for (let i = 0; i < 6; i++) await digits.nth(i).fill(otp[i]);
    await page.getByRole('button', { name: /Verify/ }).click();
    await page.waitForURL(new RegExp(`/${hospitalCode}/dashboard`), { timeout: 20000 });

    // 6. A module in the Starter plan opens; one that is not licensed is turned away with a reason.
    await page.goto(`/${hospitalCode}/patients`);
    await expect(page).toHaveURL(new RegExp(`/${hospitalCode}/patients`));
    await page.goto(`/${hospitalCode}/billing`);
    await expect(page).toHaveURL(new RegExp(`/${hospitalCode}/dashboard`), { timeout: 15000 });
    await expect(page.getByText(/not available in your current plan/i)).toBeVisible({ timeout: 10000 });

    // 7. After the operator upgrades the plan, billing opens for the same signed-in session.
    await tenant.post(`/platform/tenants/${tenant.tenantUuid}/products/${tenant.productId}/subscription/upgrade`, {
      newPlanId: tenant.plans['HMS_PRO'],
    });
    await expect
      .poll(
        async () => {
          await page.goto(`/${hospitalCode}/billing`);
          await page.waitForLoadState('networkidle');
          return new URL(page.url()).pathname.endsWith('/billing');
        },
        { timeout: 45000, message: 'billing opens after the upgrade' },
      )
      .toBe(true);
  });
});
