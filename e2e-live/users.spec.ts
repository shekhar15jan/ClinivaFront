import { expect, test } from '@playwright/test';
import { addStaffUser, signInAsNewAdmin } from './helpers';

test.describe('User management, real backend', () => {
  test('an administrator adds, deactivates, reactivates and resets staff, and sees their own name', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const email = `desk${stamp}@live-staff.test`;

    // The signed-in administrator has a name (from CloudSuite), so the header is not the "?" placeholder.
    await expect(page.locator('aside, nav').getByText('?', { exact: true })).toHaveCount(0);

    await page.goto(`/${admin.hospitalCode}/users`);
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
    // The administrator is listed with their own name, and cannot deactivate themselves.
    const own = page.locator('tr', { hasText: admin.adminEmail });
    await expect(own).toContainText('Live Admin');
    await expect(own).toContainText('This is you');
    await expect(own.getByRole('button', { name: 'Deactivate' })).toHaveCount(0);

    // Add a receptionist: the name and role are kept.
    await addStaffUser(page, admin.hospitalCode, { firstName: 'Meera', lastName: 'Nair', email, role: 'RECEPTIONIST' });
    const row = page.locator('tr', { hasText: email });
    await expect(row).toContainText('Meera Nair', { timeout: 15000 });
    await expect(row).toContainText('RECEPTIONIST');
    await expect(row).toContainText('Active');

    // The same email again is refused with a reason.
    await page.locator('#add-user').click();
    await page.fill('#user-first-name', 'Second');
    await page.fill('#user-last-name', 'Try');
    await page.fill('#user-email', email);
    await page.locator('#save-user').click();
    await expect(page.locator('#user-form-error')).toContainText(/already exists/i);
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Deactivate, then activate again.
    await row.getByRole('button', { name: 'Deactivate' }).click();
    const deactivated = page.waitForResponse((r) => /\/deactivate$/.test(r.url()));
    await page.getByRole('button', { name: 'Deactivate', exact: true }).last().click();
    expect((await deactivated).ok(), 'deactivated').toBeTruthy();
    await expect(row).toContainText('Inactive');
    await page.reload();
    await expect(page.locator('tr', { hasText: email })).toContainText('Inactive');
    const activated = page.waitForResponse((r) => /\/activate$/.test(r.url()));
    await page.locator('tr', { hasText: email }).getByRole('button', { name: 'Activate' }).click();
    expect((await activated).ok(), 'activated').toBeTruthy();
    await expect(page.locator('tr', { hasText: email })).toContainText('Active');

    // Reset password shows a new one, once.
    const reset = page.waitForResponse((r) => /\/reset-password$/.test(r.url()));
    await page.locator('tr', { hasText: email }).getByRole('button', { name: 'Reset password' }).click();
    expect((await reset).ok(), 'password reset').toBeTruthy();
    await expect(page.locator('#issued-password')).toHaveText(/\S{8,}/);
    await page.locator('#close-password').click();
    await expect(page.locator('#issued-password')).toHaveCount(0);
  });
});
