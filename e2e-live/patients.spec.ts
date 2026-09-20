import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

/** Registering and finding a patient, on real services, then proving another clinic cannot see them. */
test.describe('Patients, real backend', () => {
  test('a clinic registers a patient, finds them again after a reload, and another clinic never sees them', async ({ browser, page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_PRO');
    const stamp = Date.now().toString().slice(-6);
    const name = `Live Patient ${stamp}`;
    const phone = `9${stamp}${'0'.repeat(3)}`.slice(0, 10);

    await page.goto(`/${admin.hospitalCode}/patients`);
    await page.getByRole('button', { name: /Add Patient/ }).click();

    // The form guards itself: invalid input cannot be saved.
    const save = page.getByRole('button', { name: /Save Patient/ });
    await expect(save).toBeDisabled();
    await page.fill('#patientFullName', name);
    await page.fill('#patientDob', '1990-05-17');
    await page.selectOption('#patientGender', 'FEMALE');
    await page.fill('#patientPhone', '12345');
    await expect(save, 'a 5-digit phone number is refused').toBeDisabled();
    await page.fill('#patientPhone', phone);
    await page.fill('#patientEmail', `patient${stamp}@example.test`);
    await expect(save).toBeEnabled();

    const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients$/.test(r.url()));
    await save.click();
    expect((await created).ok(), 'patient created').toBeTruthy();

    const row = page.locator('tbody tr', { hasText: name });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText(phone);

    // It is really stored: a fresh load of the page still has it.
    await page.reload();
    await expect(page.locator('tbody tr', { hasText: name })).toBeVisible({ timeout: 15000 });

    // Another clinic, signed in separately, has an empty list.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    const other = await signInAsNewAdmin(otherPage, request, 'HMS_PRO');
    await otherPage.goto(`/${other.hospitalCode}/patients`);
    await otherPage.waitForLoadState('networkidle');
    await expect(otherPage.locator('tbody tr', { hasText: name })).toHaveCount(0);
    await otherContext.close();
  });
});
