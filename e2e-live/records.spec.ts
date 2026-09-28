import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { completePaidVisit, registerPatient, signInAsNewAdmin } from './helpers';

test.describe('Dashboard, patient record and audit trail, real backend', () => {
  test('the dashboard shows the clinic as it really is, not a fixed picture', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    // A brand-new clinic: nothing booked, nobody registered.
    await page.goto(`${admin.hospitalCode}/dashboard`);
    await expect(page.locator('#stat-patients')).toHaveText('0', { timeout: 15000 });
    await expect(page.locator('#stat-today')).toHaveText('0');
    await expect(page.locator('#queue-empty')).toBeVisible();
    await expect(page.locator('#dashboard-name')).toContainText('Live Admin');

    const visit = await completePaidVisit(page, request, browser, admin.hospitalCode);
    await page.goto(`${admin.hospitalCode}/dashboard`);
    await expect(page.locator('#stat-patients')).toHaveText('1', { timeout: 15000 });
    await expect(page.locator('#stat-doctors')).toHaveText('1');
    await expect(page.locator('#stat-bills')).toHaveText('0');
    await expect(page.locator('#stat-today')).toHaveText('1');
    const row = page.locator('#today-queue li', { hasText: visit.patientName });
    await expect(row).toContainText(visit.doctorName);
    await expect(row).toContainText('Completed');
    // None of the old sample content survives.
    await expect(page.getByText('Rahul Sharma')).toHaveCount(0);
    await expect(page.getByText('1,284')).toHaveCount(0);
  });

  test('a patient record can be corrected, shows the real visit, and can be deleted', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const visit = await completePaidVisit(page, request, browser, admin.hospitalCode);
    const stamp = Date.now().toString().slice(-6);

    await page.goto(`${admin.hospitalCode}/patients`);
    await page.locator('tbody tr', { hasText: visit.patientName }).getByRole('link', { name: visit.patientName }).click();
    await expect(page.locator('#patient-name')).toHaveText(visit.patientName, { timeout: 15000 });

    // The visit history is this patient's, with the doctor who saw them.
    const visitRow = page.locator('#visit-list li').first();
    await expect(visitRow).toContainText(visit.doctorName, { timeout: 15000 });
    await expect(visitRow).toContainText('COMPLETED');
    await expect(page.getByText('Oct 12, 2023')).toHaveCount(0);

    // Correct the details; they are kept.
    await page.locator('#edit-patient').click();
    await page.selectOption('#edit-blood', 'AB_NEGATIVE');
    await page.fill('#edit-address', `${stamp} Lake Road`);
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/hms\/patients\/[0-9a-f-]{36}$/.test(r.url()));
    await page.locator('#save-patient').click();
    expect((await saved).ok(), 'patient saved').toBeTruthy();
    await expect(page.locator('#detail-blood')).toHaveText('AB-');
    await page.reload();
    await expect(page.locator('#detail-address')).toHaveText(`${stamp} Lake Road`, { timeout: 15000 });
    await expect(page.locator('#detail-blood')).toHaveText('AB-');

    // Delete asks first, then the patient is gone from the list.
    await page.locator('#delete-patient').click();
    const deleted = page.waitForResponse((r) => r.request().method() === 'DELETE' && /\/hms\/patients\//.test(r.url()));
    await page.getByRole('dialog', { name: 'Delete patient' }).getByRole('button', { name: 'Delete', exact: true }).click();
    expect((await deleted).ok(), 'patient deleted').toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/patients$`), { timeout: 15000 });
    await expect(page.locator('tbody tr', { hasText: visit.patientName })).toHaveCount(0);
  });

  test('a CSV import says what it added and what it left out', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    await registerPatient(page, admin.hospitalCode, `Existing ${stamp}`, `9600${stamp}`.slice(0, 10));
    const file = path.join(os.tmpdir(), `patients-${stamp}.csv`);
    // name, phone, email, gender, dob, age, address, blood group; the third row repeats an existing phone.
    fs.writeFileSync(
      file,
      [
        'name,phone,email,gender,dob,age,address,blood',
        `Imported One ${stamp},9500${stamp}1,,FEMALE,1991-02-03,35,Pune,O+`.slice(0, 200),
        `Imported Two ${stamp},9400${stamp}2,,MALE,,,,`,
        `Duplicate ${stamp},9600${stamp},,MALE,,,,`,
      ].join('\n'),
    );
    await page.goto(`${admin.hospitalCode}/patients`);
    await page.getByRole('button', { name: /Import CSV/ }).click();
    await page.locator('input[type="file"]').setInputFiles(file);
    const uploaded = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/patients\/upload$/.test(r.url()));
    await page.getByRole('button', { name: /Upload|Import/ }).last().click();
    const up = await uploaded;
    expect(up.ok(), `csv accepted (${up.status()} ${(await up.text()).slice(0, 300)})`).toBeTruthy();

    await expect(page.locator('#csv-result')).toContainText('Imported 2 patients, skipped 1', { timeout: 15000 });
    await expect(page.locator('#csv-issues')).toContainText('Duplicate phone');
    // Both new patients are listed, including the one with no age (the list must not break on it).
    await expect(page.locator('tbody tr', { hasText: `Imported One ${stamp}` })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('tbody tr', { hasText: `Imported Two ${stamp}` })).toContainText('—');
    fs.unlinkSync(file);
  });

  test('the audit log can be narrowed to one kind of record and one kind of action', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    await completePaidVisit(page, request, browser, admin.hospitalCode);
    await page.goto(`${admin.hospitalCode}/audit-logs`);
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    await page.selectOption('#audit-filter-entity', 'Bill');
    await expect(page.locator('tbody tr').first()).toContainText('Bill', { timeout: 15000 });
    console.log('BILLROWS', await page.locator('tbody tr').allInnerTexts());
    await expect(page.locator('tbody')).not.toContainText('Patient');

    await page.selectOption('#audit-filter-entity', '');
    await page.selectOption('#audit-filter-action', 'CREATE');
    await expect(page.locator('tbody tr').first()).toContainText('CREATE');
    await expect(page.locator('tbody')).not.toContainText('UPDATE');

    // A combination with nothing in it says so instead of showing a blank table.
    await page.selectOption('#audit-filter-entity', 'Tenant');
    await page.selectOption('#audit-filter-action', 'LOGIN');
    await expect(page.getByText(/no .*(logs|entries|records)/i).first()).toBeVisible({ timeout: 10000 });
  });
});
