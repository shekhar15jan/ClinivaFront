import { expect, test } from '@playwright/test';
import { registerPatient, signInAsNewAdmin } from './helpers';

test.describe('Clinic settings, real backend', () => {
  test('changes are saved on the server, shown after a reload, and the patient id prefix is honoured', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const clinicName = `Live Care ${stamp}`;

    await page.goto(`/${admin.hospitalCode}/settings`);
    await expect(page.getByRole('heading', { name: 'Clinic Settings' })).toBeVisible({ timeout: 15000 });
    // The form is filled from what the server holds, not left blank.
    await expect(page.locator('#settingsClinicName')).not.toHaveValue('', { timeout: 15000 });

    await page.fill('#settingsClinicName', clinicName);
    await page.fill('#settingsPhone', '9876512345');
    await page.fill('#settingsAddress', '12 Lake Road, Pune');
    await page.fill('#settingsPatientIdPrefix', 'LC');
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/hms\/settings$/.test(r.url()));
    await page.getByRole('button', { name: 'Save Settings' }).click();
    const response = await saved;
    expect(response.ok(), `settings saved (${response.status()})`).toBeTruthy();

    await page.reload();
    await expect(page.locator('#settingsClinicName')).toHaveValue(clinicName, { timeout: 15000 });
    await expect(page.locator('#settingsPhone')).toHaveValue('9876512345');
    await expect(page.locator('#settingsAddress')).toHaveValue('12 Lake Road, Pune');
    await expect(page.locator('#settingsPatientIdPrefix')).toHaveValue('LC');

    // A patient registered now gets the new prefix.
    const patientName = `Prefix Patient ${stamp}`;
    await registerPatient(page, admin.hospitalCode, patientName, `96${stamp}31`.slice(0, 10));
    await page.goto(`/${admin.hospitalCode}/patients`);
    await expect(page.locator('tbody tr', { hasText: patientName })).toContainText('LC-', { timeout: 15000 });

    // Email templates open from Advanced.
    await page.goto(`/${admin.hospitalCode}/settings`);
    await page.getByRole('button', { name: /Email Templates|Manage/ }).first().click();
    await expect(page).toHaveURL(/\/settings\/email-templates$/);
    await expect(page.locator('main')).toContainText(/template/i);
  });
});
