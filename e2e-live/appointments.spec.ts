import { expect, test } from '@playwright/test';
import { registerDoctor, registerPatient, signInAsNewAdmin } from './helpers';

/**
 * The core clinical workflow on real services: a clinic sets a doctor's hours, then books a patient
 * into a slot. Before the schedule editor existed, a new doctor had no hours and no way to get any,
 * so no appointment could be booked from the UI at all.
 */
test.describe('Appointments, real backend', () => {
  test('a doctor with no hours has no slots; after the clinic sets a schedule a patient can be booked', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_PRO');
    const stamp = Date.now().toString().slice(-6);
    const doctorName = `Dr. Booking ${stamp}`;
    const patientName = `Booked Patient ${stamp}`;
    await registerDoctor(page, admin.hospitalCode, doctorName, `98${stamp}01`.slice(0, 10));
    await registerPatient(page, admin.hospitalCode, patientName, `97${stamp}02`.slice(0, 10));

    // 1. No hours yet: the booking screen has nothing to offer for this doctor.
    await page.goto(`/${admin.hospitalCode}/appointments/book`);
    await page.locator('[aria-label="Select Date"] [role="radio"]').first().click();
    await page.locator('[aria-label="Select Doctor"] [role="radio"]', { hasText: doctorName }).click();
    await expect(page.getByText(/No slots available/)).toBeVisible();

    // 2. Set the doctor's hours on their page (every day, so the test does not depend on today's weekday).
    await page.goto(`/${admin.hospitalCode}/doctors`);
    await page.getByRole('button', { name: `View ${doctorName}` }).click();
    await expect(page.getByRole('heading', { name: 'Weekly Schedule' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#doctor-experience')).toContainText('8 years');
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
      await page.getByLabel(`${day} available`).check();
      await page.getByLabel(`${day} end`).fill('12:00');
    }
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/availability$/.test(r.url()));
    await page.locator('#save-availability').click();
    expect((await saved).ok(), 'schedule saved').toBeTruthy();
    await expect(page.locator('#availability-saved')).toBeVisible();

    // 3. The hours are stored, not just shown: a reload still has them.
    await page.reload();
    await expect(page.getByLabel('Monday available')).toBeChecked({ timeout: 15000 });
    await expect(page.getByLabel('Monday end')).toHaveValue('12:00');

    // 4. Now the same doctor can be booked.
    await page.goto(`/${admin.hospitalCode}/appointments/book`);
    await page.locator('[aria-label="Select Date"] [role="radio"]').first().click();
    await page.locator('[aria-label="Select Doctor"] [role="radio"]', { hasText: doctorName }).click();
    const slots = page.locator('[aria-label="Available Time Slots"] [role="radio"]');
    await expect(slots.first()).toBeVisible({ timeout: 15000 });
    await slots.first().click();
    await page.getByRole('button', { name: /Next Step/ }).click();
    // Step 2: the patient registered above is offered.
    const option = page.locator('#patientId option', { hasText: patientName });
    await expect(option).toHaveCount(1, { timeout: 15000 });
    await page.selectOption('#patientId', (await option.getAttribute('value'))!);
    await page.getByRole('button', { name: /Next Step/ }).click();

    // Step 3: confirm. The booking must reach the backend and be accepted.
    await expect(page.getByRole('heading', { name: 'Confirm Appointment' })).toBeVisible();
    await expect(page.getByText(doctorName).first()).toBeVisible();
    const booked = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/appointments$/.test(r.url()));
    await page.getByRole('button', { name: /Confirm/ }).last().click();
    const response = await booked;
    expect(response.ok(), `booking accepted (${response.status()})`).toBeTruthy();

    // After booking the user lands on the clinic's appointments, with confirmation, not on a "page not found".
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/appointments$`), { timeout: 10000 });
    await expect(page.getByText(/Appointment booked successfully/)).toBeVisible();

    // The appointment exists for this clinic: the day's list has it.
    await page.goto(`/${admin.hospitalCode}/appointments`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(patientName).first()).toBeVisible({ timeout: 15000 });
  });
});
