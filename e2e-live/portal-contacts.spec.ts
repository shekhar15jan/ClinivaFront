import { expect, test } from '@playwright/test';
import { completePaidVisit, signInAsNewAdmin, signInWithOtp } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';

test.describe('Contact messages and the patient portal, real backend', () => {
  test('a website visitor writes in, the administrator replies, and the reply is kept', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const subject = `Timings on Sunday ${stamp}`;

    // The public contact form has no account: the visitor is anonymous.
    const sent = await request.post(`${CLINIVA}/hms/contacts`, {
      data: { tenantId: admin.tenantUuid, name: 'Anita Visitor', email: `anita${stamp}@example.test`, phone: '9876500000', subject, message: 'Is the clinic open on Sunday morning?' },
    });
    expect(sent.ok(), `contact submitted (${sent.status()})`).toBeTruthy();

    await page.goto(`/${admin.hospitalCode}/contacts`);
    const row = page.locator('tr', { hasText: subject });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row).toContainText('Anita Visitor');

    await row.getByRole('button', { name: 'Reply' }).click();
    await expect(page.getByText('Is the clinic open on Sunday morning?')).toBeVisible();
    await page.fill('#contact-reply-text', 'We are open 9 to 12 on Sundays.');
    const replied = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/reply$/.test(r.url()));
    await page.getByRole('button', { name: /Send Reply|Send/ }).last().click();
    const response = await replied;
    expect(response.ok(), `reply saved (${response.status()})`).toBeTruthy();

    // Kept on the server: after a reload the message shows as answered with the reply.
    await page.reload();
    await expect(page.locator('tr', { hasText: subject })).toContainText(/resolved/i, { timeout: 15000 });
    await page.locator('tr', { hasText: subject }).getByRole('button', { name: 'Reply' }).click();
    await expect(page.getByText('We are open 9 to 12 on Sundays.')).toBeVisible();
  });

  test('a patient signs in to the portal and sees their own visit, prescription and bill', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const patientEmail = `patient${stamp}@live-patients.test`;
    const visit = await completePaidVisit(page, request, browser, admin.hospitalCode, patientEmail);

    const context = await browser.newContext();
    const portal = await context.newPage();
    await signInWithOtp(portal, request, patientEmail);
    await expect(portal).toHaveURL(new RegExp(`/${admin.hospitalCode}/patient/dashboard`));

    // The patient's own screens show this visit, and only this patient's.
    await portal.goto(`/${admin.hospitalCode}/patient/appointments`);
    await expect(portal.getByText(visit.doctorName).first()).toBeVisible({ timeout: 15000 });

    await portal.goto(`/${admin.hospitalCode}/patient/prescriptions`);
    await expect(portal.getByText(visit.doctorName).first()).toBeVisible({ timeout: 15000 });

    await portal.goto(`/${admin.hospitalCode}/patient/bills`);
    await expect(portal.getByText('750').first()).toBeVisible({ timeout: 15000 });
    await expect(portal.getByText(/paid/i).first()).toBeVisible();

    await portal.goto(`/${admin.hospitalCode}/patient/profile`);
    await expect(portal.getByText(visit.patientName).first()).toBeVisible({ timeout: 15000 });
    await expect(portal.getByText(patientEmail).first()).toBeVisible();

    // The patient rates the completed visit; it waits for the clinic's approval.
    await portal.goto(`/${admin.hospitalCode}/patient/appointments`);
    await portal.locator('.rate-visit').first().click();
    await portal.selectOption('#review-rating', '5');
    await portal.fill('#review-text', 'Kind and thorough.');
    const reviewed = portal.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/reviews$/.test(r.url()));
    await portal.locator('#submit-review').click();
    const reviewRes = await reviewed;
    expect(reviewRes.ok(), `review sent (${reviewRes.status()})`).toBeTruthy();
    await expect(portal.getByText('Reviewed').first()).toBeVisible();

    // A patient cannot open the clinic's staff screens: they are sent back to their own dashboard.
    await portal.goto(`/${admin.hospitalCode}/users`);
    await expect(portal).not.toHaveURL(/\/users$/);
    await context.close();

    // The administrator sees the pending review, with the patient and doctor named, and approves it.
    await page.goto(`/${admin.hospitalCode}/reviews`);
    const row = page.locator('tr', { hasText: visit.patientName });
    await expect(row).toContainText(visit.doctorName, { timeout: 15000 });
    await expect(row).toContainText('Kind and thorough.');
    const approved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/approve$/.test(r.url()));
    await row.getByRole('button', { name: 'Approve' }).click();
    expect((await approved).ok(), 'review approved').toBeTruthy();
    await page.getByRole('button', { name: /Approved/ }).first().click();
    await expect(page.locator('tr', { hasText: visit.patientName })).toContainText('Kind and thorough.');
  });
});
