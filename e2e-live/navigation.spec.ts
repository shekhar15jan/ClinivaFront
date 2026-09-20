import { expect, test } from '@playwright/test';
import { registerPatient, signInAsNewAdmin } from './helpers';

/**
 * Links must stay inside the signed-in clinic. Several pointed at "/patients", "/appointments" and
 * so on without the clinic code, which the app reads as a clinic named "patients" and answers by
 * sending the user to the login page.
 */
test.describe('Navigation inside a clinic, real backend', () => {
  test('opening a patient, coming back, and the phone quick actions never leave the clinic', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_PRO');
    const stamp = Date.now().toString().slice(-6);
    const name = `Linked Patient ${stamp}`;
    await registerPatient(page, admin.hospitalCode, name, `96${stamp}03`.slice(0, 10));
    const inClinic = (path: string) => new RegExp(`/${admin.hospitalCode}/${path}$`);

    // Open a patient from the list, then come back with the header's back button.
    await page.goto(`/${admin.hospitalCode}/patients`);
    await page.locator('tbody tr', { hasText: name }).locator('a').first().click();
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/patients/[0-9a-f-]{36}$`));
    await expect(page.getByRole('heading', { name: 'Patient Profile' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(name).first()).toBeVisible();
    await page.locator('button:has(.material-symbols-outlined:text("arrow_back"))').first().click();
    await expect(page).toHaveURL(inClinic('patients'));

    // The dashboard's quick actions (shown on a phone) go to this clinic's screens.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${admin.hospitalCode}/dashboard`);
    await page.getByRole('button', { name: /Register Patient/ }).click();
    await expect(page).toHaveURL(inClinic('patients'));
    await page.goto(`/${admin.hospitalCode}/dashboard`);
    await page.getByRole('button', { name: /Book$/ }).click();
    await expect(page).toHaveURL(inClinic('appointments/book'));

    // Cancel on the booking screen returns to the clinic's appointments.
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(inClinic('appointments'));
  });
});
