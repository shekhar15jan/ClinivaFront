import { expect, test } from '@playwright/test';
import { registerDoctor, setDoctorHours, signInAsNewAdmin } from './helpers';

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Online booking on real services: the page is closed until the clinic opens it; a visitor with no sign-in then asks for a
 * free time; the front desk sees the request and books it, which puts the visitor on the day's appointments.
 */
test.describe('Online booking, real backend', () => {
  test('a visitor asks for a time and the front desk books it @desktop', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const doctorName = `Dr. Online ${stamp}`;
    const visitorName = `Online Visitor ${stamp}`;
    await registerDoctor(page, admin.hospitalCode, doctorName, `98${stamp}31`.slice(0, 10), `dr.online${stamp}@live-staff.test`);
    await setDoctorHours(page, admin.hospitalCode, doctorName);

    // Closed until the clinic switches it on.
    const visitorContext = await browser.newContext();
    const visitor = await visitorContext.newPage();
    await visitor.goto(`${admin.hospitalCode}/book`);
    await expect(visitor.locator('#booking-closed')).toBeVisible({ timeout: 20000 });

    // The admin opens it.
    await page.goto(`${admin.hospitalCode}/settings`);
    await page.locator('#online-booking').check();
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/online-booking$/.test(r.url()));
    await page.locator('#save-settings').click();
    expect((await saved).ok(), 'switch saved').toBeTruthy();

    // The visitor (no sign-in) picks the doctor, tomorrow, the first free time, and asks.
    await visitor.goto(`${admin.hospitalCode}/book`);
    await expect(visitor.locator('#clinic-name')).toBeVisible({ timeout: 20000 });
    await visitor.locator('.doctor', { hasText: doctorName }).click();
    await visitor.locator('#booking-date').fill(isoDate(new Date(Date.now() + 86400000)));
    const times = visitor.locator('#times .time');
    await expect(times.first()).toBeVisible({ timeout: 15000 });
    await times.first().click();
    await visitor.locator('#booking-name').fill(visitorName);
    await visitor.locator('#booking-phone').fill(`96${stamp}41`.slice(0, 10));
    const sent = visitor.waitForResponse((r) => r.request().method() === 'POST' && /\/requests$/.test(r.url()));
    await visitor.locator('#booking-send').click();
    expect((await sent).ok(), 'request accepted').toBeTruthy();
    await expect(visitor.locator('#booking-done')).toContainText('BK-');

    // The front desk sees it and books it.
    await page.goto(`${admin.hospitalCode}/booking-requests`);
    const row = page.locator('[data-request]', { hasText: visitorName });
    await expect(row).toBeVisible({ timeout: 15000 });
    const booked = page.waitForResponse((r) => r.request().method() === 'POST' && /\/book$/.test(r.url()));
    await row.locator('.book').click();
    expect((await booked).ok(), 'request booked').toBeTruthy();
    await expect(page.locator('#no-requests')).toBeVisible({ timeout: 15000 });
    await visitorContext.close();
  });
});
