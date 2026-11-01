import { expect, test } from '@playwright/test';
import { registerDoctor, signInAsNewAdmin, signInWithOtp } from './helpers';
import { bearerOf, cliniva, watchFailures } from './helpers-cross';

/**
 * Plan and billing, Cliniva screen over CloudSuite billing (real services, no mock data).
 * Razorpay keys may be missing on staging, so Pay may end in a payment link or in a friendly "unavailable" message;
 * both are fine, an error page or a script error is not.
 */
test.describe('Plan and billing, clinic over CloudSuite', () => {
  test('the owner sees plan, price, end and renewal date and the published plans; Pay opens a payment link or says plainly it is unavailable; a doctor cannot open it @desktop', async ({ page, request, browser }) => {
    // Step 1: a fresh clinic and its owner, signed in through the real screens.
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const code = admin.hospitalCode;
    const watch = watchFailures(page);

    // Step 2: Settings > Plan & billing from the sidebar (the menu entry is there for the owner).
    await expect(page.getByRole('link', { name: /Plan & billing/ }).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    await page.goto(`${code}/settings/plan`);
    await expect(page.getByRole('heading', { name: 'Plan and billing' })).toBeVisible();
    await expect(page.locator('#plan-summary')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#plan-error')).toHaveCount(0);

    // Step 3: the four figures from CloudSuite are shown, and agree with what the clinic API says.
    const bearer = await bearerOf(page);
    const api = cliniva(request, bearer);
    const overview = await api('GET', '/hms/billing-plan');
    expect(overview.status, 'GET /hms/billing-plan').toBe(200);
    const o = overview.body.data;
    expect(o.planName, 'plan name from CloudSuite').toBeTruthy();
    await page.locator('#plan-summary').waitFor();
    await expect(page.locator('#plan-name')).toHaveText(o.planName);
    await expect(page.locator('#plan-price')).toContainText('₹');
    await expect(page.locator('#plan-end')).not.toHaveText('');
    await expect(page.locator('#plan-renewal')).not.toHaveText('');
    // An end date and a renewal date are expected for a new clinic; say so plainly if the platform sent none.
    expect(o.endDate, 'end date from CloudSuite').toBeTruthy();
    expect(o.renewalDate, 'renewal date from CloudSuite').toBeTruthy();

    // Step 4: the published plans are tiles, the same ones the API lists.
    const plans = (await api('GET', '/hms/billing-plan/plans')).body.data as { code: string; name: string; price: number }[];
    expect(plans.length, 'at least one published plan').toBeGreaterThan(0);
    const tiles = page.locator('#plan-tiles button[data-plan]');
    await expect(tiles).toHaveCount(plans.length);
    for (const p of plans) await expect(page.locator(`#plan-tiles button[data-plan="${p.code}"]`)).toContainText(p.name);

    // Step 5: choose a tile, the pay bar names it, then press Pay.
    const chosen = plans[0];
    await page.locator(`#plan-tiles button[data-plan="${chosen.code}"]`).click();
    await expect(page.locator('#plan-pay-bar')).toContainText(chosen.name);
    const popupPromise = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null);
    const checkout = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/billing-plan\/checkout$/.test(r.url()));
    await page.locator('#plan-pay').click();
    const res = await checkout;

    if (res.ok()) {
      // Step 6a: a payment link was made: the payment page opens in a new tab on a Razorpay address, and the screen waits for the payment.
      const link: string = (await res.json()).data.paymentLinkUrl;
      expect(new URL(link).host, 'payment link host').toMatch(/razorpay/i);
      const popup = await popupPromise;
      expect(popup, 'the payment page opened in a new tab').toBeTruthy();
      await expect(page.locator('#plan-pending')).toBeVisible({ timeout: 20000 });
      await expect(page.locator('#plan-invoices')).toBeVisible();
      await popup!.close();
    } else {
      // Step 6b: online payment is not set up (the platform answers 503 PAYMENT_UNAVAILABLE, the clinic API passes it on as 503): a plain message, no error page.
      expect(res.status(), 'only the documented "payment unavailable" refusal is allowed').toBe(503);
      const body = await res.json();
      expect(String(body.message ?? ''), 'friendly message from the API').not.toMatch(/exception|stack|null pointer|internal server/i);
      await expect(page.locator('[role="alert"]').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#plan-summary')).toBeVisible();
      expect(await popupPromise, 'no payment tab opens when payment is unavailable').toBeNull();
    }

    // Step 7: nothing else failed: the only refused API call allowed is the documented 503 on checkout; no script errors.
    const unexpected = watch.failedCalls.filter((c) => !/billing-plan\/checkout -> 503/.test(c));
    expect(unexpected, 'failing API calls').toEqual([]);
    expect(watch.pageErrors, 'script errors').toEqual([]);
    const consoleNoise = watch.consoleErrors.filter((m) => !/status of 503/.test(m));
    expect(consoleNoise, 'console errors').toEqual([]);

    // Step 8: a doctor of the same clinic (signed in with their own emailed code) cannot open the screen or the API.
    const stamp = Date.now().toString().slice(-6);
    const doctorEmail = `dr.plan${stamp}@live-staff.test`;
    await registerDoctor(page, code, `Dr. Plan ${stamp}`, `98${stamp}31`.slice(0, 10), doctorEmail);
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const doctor = await context.newPage();
    await signInWithOtp(doctor, request, doctorEmail);
    await expect(doctor.getByRole('link', { name: /Plan & billing/ })).toHaveCount(0);
    await doctor.goto(`${code}/settings/plan`);
    await expect.poll(() => new URL(doctor.url()).pathname, { timeout: 15000 }).not.toMatch(/\/settings\/plan$/);
    await expect(doctor.locator('#plan-summary')).toHaveCount(0);
    const doctorBearer = await bearerOf(doctor);
    expect((await cliniva(request, doctorBearer)('GET', '/hms/billing-plan')).status, 'doctor reads the plan').toBe(403);
    expect((await cliniva(request, doctorBearer)('POST', '/hms/billing-plan/checkout', { planCode: chosen.code })).status, 'doctor starts a payment').toBe(403);
    await context.close();
  });
});
