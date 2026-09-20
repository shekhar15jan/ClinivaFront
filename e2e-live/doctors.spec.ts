import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

test.describe('Doctors, real backend', () => {
  test('a clinic registers a doctor and sees them in the list after a reload', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_PRO');
    const stamp = Date.now().toString().slice(-6);
    const name = `Dr. Live ${stamp}`;

    await page.goto(`/${admin.hospitalCode}/doctors`);
    await page.getByText('Add Doctor', { exact: false }).first().click();
    await expect(page.getByRole('heading', { name: 'Doctor Registration' })).toBeVisible();

    const save = page.getByRole('button', { name: /Save Doctor/ });
    await expect(save, 'nothing filled in yet').toBeDisabled();
    await page.fill('input[formControlName="fullName"]', name);
    await page.locator('select[formControlName="specialization"]').selectOption({ index: 1 });
    await page.fill('input[formControlName="qualification"]', 'MBBS, MD');
    await page.fill('input[formControlName="experienceYears"]', '8');
    await page.fill('input[formControlName="phone"]', `98${stamp}00`.slice(0, 10));
    await page.fill('input[formControlName="email"]', `doctor${stamp}@example.test`);
    await page.fill('input[formControlName="consultationFee"]', '600');

    const created = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/doctors$/.test(r.url()));
    await expect(save).toBeEnabled();
    await save.click();
    expect((await created).ok(), 'doctor created').toBeTruthy();

    await page.goto(`/${admin.hospitalCode}/doctors`);
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15000 });
    await page.reload();
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15000 });
  });
});
