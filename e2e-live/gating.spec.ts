import { expect, test } from '@playwright/test';
import { addStaffUser, signInAsNewAdmin, signInWithOtp } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';

const link = (page: import('@playwright/test').Page, hospitalCode: string, route: string) =>
  page.locator(`app-sidebar a[href="/${hospitalCode}/${route}"]`);

test.describe('What each clinic and role is offered, real backend', () => {
  test('a Starter clinic is offered only its plan, and a direct address for anything else is turned away', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_STARTER');
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`/${admin.hospitalCode}/dashboard`);

    for (const route of ['patients', 'doctors', 'appointments', 'users', 'settings']) {
      await expect(link(page, admin.hospitalCode, route), `${route} is offered`).toHaveCount(1, { timeout: 15000 });
    }
    for (const route of ['billing', 'payments', 'prescriptions', 'consultations', 'medicines', 'reports', 'health-packages', 'contacts', 'reviews']) {
      await expect(link(page, admin.hospitalCode, route), `${route} is not in the plan`).toHaveCount(0);
    }

    // Typing the address of a module outside the plan is answered by a message and the dashboard.
    await page.goto(`/${admin.hospitalCode}/billing`);
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/dashboard$`), { timeout: 15000 });
    await expect(page.getByText(/not available in your current plan/i)).toBeVisible();

    // Same for another module outside the plan.
    await page.goto(`/${admin.hospitalCode}/medicines`);
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/dashboard$`), { timeout: 15000 });
  });

  test('a receptionist is offered the front desk and nothing the API would refuse', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const email = `desk${stamp}@live-staff.test`;
    await addStaffUser(page, admin.hospitalCode, { firstName: 'Front', lastName: 'Desk', email, role: 'RECEPTIONIST' });

    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const desk = await context.newPage();
    await signInWithOtp(desk, request, email);
    await expect(link(desk, admin.hospitalCode, 'patients')).toHaveCount(1, { timeout: 15000 });

    for (const route of ['patients', 'appointments', 'billing', 'payments', 'medicines', 'doctors']) {
      await expect(link(desk, admin.hospitalCode, route), `${route} is offered`).toHaveCount(1);
    }
    for (const route of ['users', 'audit-logs', 'settings', 'reports', 'consultations', 'prescriptions', 'reviews', 'contacts']) {
      await expect(link(desk, admin.hospitalCode, route), `${route} is not for a receptionist`).toHaveCount(0);
    }

    // A receptionist who types the address of an administrator screen does not get a working screen.
    await desk.goto(`/${admin.hospitalCode}/users`);
    await expect(desk).not.toHaveURL(/\/users$/, { timeout: 15000 });
    await context.close();
  });

  test('a suspended clinic is told so at sign-in, and works again once reactivated', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    await admin.patch(`/platform/tenants/${admin.tenantUuid}/suspend`);

    const context = await browser.newContext();
    const visitor = await context.newPage();
    await visitor.goto('/login');
    await visitor.fill('input[type="email"]', admin.adminEmail);
    await visitor.locator('button[type="submit"]').first().click();
    await visitor.waitForURL((url) => /^\/[^/]+\/login$/.test(url.pathname), { timeout: 15000 });
    await visitor.locator('button:has-text("Send OTP")').click();
    await expect(visitor.getByText(/suspended/i).first()).toBeVisible({ timeout: 15000 });
    await expect(visitor).toHaveURL(/\/login$/);

    // The sign-in code is not sent for a suspended clinic.
    const sent = await request.post(`${CLINIVA}/auth/send-otp`, { data: { email: admin.adminEmail } });
    expect(sent.ok()).toBeFalsy();

    await admin.patch(`/platform/tenants/${admin.tenantUuid}/activate`);
    // Reactivation reaches Cliniva through the integration; sign in works again.
    await expect
      .poll(async () => (await request.post(`${CLINIVA}/auth/send-otp`, { data: { email: admin.adminEmail } })).ok(), { timeout: 30000 })
      .toBe(true);
    await context.close();
  });
});
