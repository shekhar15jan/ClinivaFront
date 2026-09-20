import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

const isApi = (method: string, path: RegExp) => (r: import('@playwright/test').Response) =>
  r.request().method() === method && path.test(r.url());

test.describe('Medicines and health packages, real backend', () => {
  test('a medicine can be added, found, edited and deleted, and the list follows each change', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const name = `Paracetamol ${stamp}`;
    await page.goto(`/${admin.hospitalCode}/medicines`);

    await page.getByRole('button', { name: /Add Medicine|Add New/ }).first().click();
    await page.fill('#med-form-name', name);
    await page.fill('#med-form-generic-name', 'Acetaminophen');
    await page.selectOption('#med-form-category', 'Analgesic');
    await page.fill('#med-form-manufacturer', 'Acme Pharma');
    await page.fill('#med-form-unit', 'Tablet');
    await page.fill('#med-form-price', '12.50');
    const created = page.waitForResponse(isApi('POST', /\/hms\/medicines$/));
    await page.locator('form button[type="submit"]').click();
    expect((await created).ok(), 'medicine created').toBeTruthy();
    await expect(page.getByText(name).first()).toBeVisible();

    // Search narrows the list to it.
    await page.getByPlaceholder(/Search medicines/).fill(stamp);
    await expect(page.getByText(name).first()).toBeVisible();
    await page.getByPlaceholder(/Search medicines/).fill('zzz-no-such-medicine');
    await expect(page.getByText(name)).toHaveCount(0);
    await page.getByPlaceholder(/Search medicines/).fill(stamp);

    // Edit the price and see it saved.
    await page.locator('tr', { hasText: name }).getByRole('button', { name: 'Edit' }).click();
    await page.fill('#med-form-price', '15.00');
    const updated = page.waitForResponse(isApi('PUT', /\/hms\/medicines\/[0-9a-f-]{36}$/));
    await page.locator('form button[type="submit"]').click();
    const updatedRes = await updated;
    expect(updatedRes.ok(), 'medicine updated').toBeTruthy();
    expect(JSON.stringify(await updatedRes.json())).toContain('1500');
    await page.reload();
    await page.getByPlaceholder(/Search medicines/).fill(stamp);
    await expect(page.locator('tr', { hasText: name })).toContainText('15');

    // Delete.
    await page.locator('tr', { hasText: name }).getByRole('button', { name: 'Delete' }).click();
    const deleted = page.waitForResponse(isApi('DELETE', /\/hms\/medicines\/[0-9a-f-]{36}$/));
    await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
    expect((await deleted).ok(), 'medicine deleted').toBeTruthy();
    await page.reload();
    await page.getByPlaceholder(/Search medicines/).fill(stamp);
    // Delete discontinues the medicine rather than erasing it, so past prescriptions still resolve.
    await expect(page.locator('tr', { hasText: name })).toContainText('Discontinued');
  });

  test('a health package can be created, edited, booked and deactivated', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const name = `Full Body Checkup ${stamp}`;
    await page.goto(`/${admin.hospitalCode}/health-packages`);

    await page.getByRole('button', { name: 'Create Package' }).first().click();
    await page.fill('#pkg-form-name', name);
    await page.fill('#pkg-form-description', 'Blood, urine and ECG');
    await page.fill('#pkg-form-tests', 'CBC, Lipid profile, ECG');
    await page.fill('#pkg-form-actual-price', '250000');
    await page.fill('#pkg-form-offer-price', '199900');
    const created = page.waitForResponse(isApi('POST', /\/hms\/health-packages$/));
    await page.getByRole('dialog').getByRole('button', { name: 'Create Package' }).click();
    expect((await created).ok(), 'package created').toBeTruthy();
    const row = page.locator('tr', { hasText: name });
    await expect(row.first()).toBeVisible();

    // Edit
    await row.first().getByRole('button', { name: 'Edit' }).click();
    await page.fill('#pkg-form-offer-price', '189900');
    const updated = page.waitForResponse(isApi('PUT', /\/hms\/health-packages\/[0-9a-f-]{36}$/));
    await page.getByRole('dialog').getByRole('button', { name: 'Update Package' }).click();
    expect((await updated).ok(), 'package updated').toBeTruthy();

    // Book it for a visitor.
    await row.first().getByRole('button', { name: 'Book' }).click();
    await page.fill('#pkg-booking-name', 'Walk In Visitor');
    await page.fill('#pkg-booking-email', `visitor${stamp}@example.test`);
    await page.fill('#pkg-booking-phone', '9876500000');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await page.fill('#pkg-booking-date', tomorrow);
    const booked = page.waitForResponse(isApi('POST', /\/hms\/health-packages\/[0-9a-f-]{36}\/book/));
    await page.getByRole('button', { name: /Confirm|Book Now|Submit|Book$/ }).last().click();
    expect((await booked).ok(), 'package booked').toBeTruthy();

    // The booking shows on the bookings screen, waiting; the front desk approves it and that is kept.
    await page.goto(`/${admin.hospitalCode}/health-packages/bookings`);
    const booking = page.locator('tr', { hasText: 'Walk In Visitor' });
    await expect(booking).toContainText(name, { timeout: 15000 });
    await expect(booking).toContainText('PENDING');
    const approved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/bookings\/[0-9a-f-]{36}\/approve$/.test(r.url()));
    await booking.getByRole('button', { name: 'Approve' }).click();
    expect((await approved).ok(), 'booking approved').toBeTruthy();
    await expect(booking).toContainText('APPROVED');
    await page.reload();
    await expect(page.locator('tr', { hasText: 'Walk In Visitor' })).toContainText('APPROVED', { timeout: 15000 });

    // Deactivate
    await page.goto(`/${admin.hospitalCode}/health-packages`);
    const toggled = page.waitForResponse((r) => ['PUT', 'PATCH'].includes(r.request().method()) && /\/hms\/health-packages\//.test(r.url()));
    await page.locator('tr', { hasText: name }).first().getByRole('button', { name: 'Deactivate' }).click();
    expect((await toggled).ok(), 'package deactivated').toBeTruthy();
    await expect(page.locator('tr', { hasText: name }).first()).toContainText(/Inactive/i);
  });
});
