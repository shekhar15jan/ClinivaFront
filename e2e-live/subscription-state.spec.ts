import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';
import { bearerOf, cliniva, cloudSuite, operatorToken } from './helpers-cross';

/**
 * Where the clinic stands in its subscription: trial banner with days left, read-only after the term plus grace, locked.
 * Cliniva works the state out from the subscription dates it holds (TRIAL / READ_ONLY / LOCKED).
 */
test.describe('Subscription state, clinic over CloudSuite', () => {
  test('a new clinic shows the trial banner with the days left, and Choose a plan leads to Plan and billing @desktop', async ({ page, request }) => {
    // Step 1: fresh clinic, owner signed in.
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const code = admin.hospitalCode;

    // Step 2: the trial banner is across the top, with a day count (or "last day" / "1 day left").
    await page.goto(`${code}/dashboard`);
    const banner = page.locator('#subscription-banner-trial');
    await expect(banner, 'trial banner for a new clinic').toBeVisible({ timeout: 20000 });
    await expect(banner).toContainText('Free trial');
    const text = (await banner.innerText()).replace(/\s+/g, ' ');
    const days = text.match(/(\d+) days left/);
    if (days) {
      expect(Number(days[1]), 'days left in a new trial').toBeGreaterThan(0);
      expect(Number(days[1]), 'days left in a new trial').toBeLessThanOrEqual(60);
    } else {
      expect(text).toMatch(/1 day left|last day|trial is running/);
    }
    await expect(page.locator('#subscription-banner-readonly')).toHaveCount(0);

    // Step 3: while in trial, work is not blocked: a patient can be added.
    const api = cliniva(request, await bearerOf(page));
    const made = await api('POST', '/hms/patients', { fullName: 'Trial Patient', gender: 'FEMALE', phone: `98${Date.now().toString().slice(-8)}`, dateOfBirth: '1990-01-01' });
    expect(made.status, 'a trial clinic can add patients').toBeLessThan(300);

    // Step 4: Choose a plan opens Settings > Plan & billing.
    await page.goto(`${code}/dashboard`);
    await page.getByRole('link', { name: 'Choose a plan' }).click();
    await expect(page).toHaveURL(/\/settings\/plan$/);
    await expect(page.locator('#plan-summary')).toBeVisible({ timeout: 20000 });
  });

  test('when the platform cancels the subscription the clinic is locked: changes and reads are refused with a plain message @desktop', async ({ page, request }) => {
    // Step 1: fresh clinic; the operator cancels its subscription through the documented platform API
    // (TenantSubscriptionController PATCH /platform/tenants/{tenantId}/subscription/cancel).
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const bearer = await bearerOf(page);
    const api = cliniva(request, bearer);
    const platform = cloudSuite(request, await operatorToken(request));
    const cancelled = await platform('PATCH', `/platform/tenants/${admin.tenantUuid}/subscription/cancel`);
    test.skip(cancelled.status >= 400, `cancel is not possible for this tenant (${cancelled.status}: ${cancelled.text.slice(0, 120)})`);

    // Step 2: the cancellation reaches Cliniva through the integration (allow time; Cliniva also caches the state for 30 seconds).
    await expect
      .poll(async () => (await api('POST', '/hms/patients', { fullName: 'Locked Patient', gender: 'FEMALE', phone: '9876500777', dateOfBirth: '1990-01-01' })).status,
        { timeout: 60000, intervals: [2000, 5000], message: 'Cliniva locks the clinic after the platform cancels it' })
      .toBe(403);
    const refused = await api('POST', '/hms/patients', { fullName: 'Locked Patient', gender: 'FEMALE', phone: '9876500777', dateOfBirth: '1990-01-01' });
    expect(refused.text).toContain('SUBSCRIPTION_LOCKED');
    // Reading is refused too.
    expect((await api('GET', '/hms/patients?page=0&size=1')).status).toBe(403);

    // Step 3: the screen tells the owner plainly (no blank page): the reload ends on a message or the sign-in.
    await page.goto(`${admin.hospitalCode}/dashboard`);
    await expect.poll(async () => /locked|ended|renew|login/i.test(page.url() + ' ' + (await page.locator('body').innerText())), { timeout: 20000 }).toBe(true);
  });

  // The READ_ONLY state (view only, with the "Renew" banner) starts the day after the trial or term end date and lasts
  // the grace days (app.subscription.grace-days, 15). Cliniva derives it from the subscription dates alone.
  // There is no operator API that moves an end date into the past: CloudSuite renew / upgrade / cancel / suspend only
  // move forward or lock, and Cliniva's internal subscription endpoints need the product key and only set dates ahead.
  // Needed to make this test real: a staging-only operator call (for example PATCH .../subscription/end-date with a date
  // in the past, guarded to non-production), or a staging configuration with app.subscription.trial-days=0.
  // Until then it is not guessed at through the database.
  test.fixme('the clinic past its term shows the view-only banner with a Renew button, reads work and changes are refused with SUBSCRIPTION_READ_ONLY @desktop', async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    // Step 1 (needs the missing operator call): put the subscription end date a few days in the past.
    // Step 2: reload; expect #subscription-banner-readonly with "view only" and a #subscription-renew link to settings/plan.
    await page.goto(`${admin.hospitalCode}/dashboard`);
    await expect(page.locator('#subscription-banner-readonly')).toBeVisible();
    // Step 3: GET /hms/patients works (200) and POST /hms/patients is refused 403 SUBSCRIPTION_READ_ONLY.
    // Step 4: Renew leads to Settings > Plan & billing, which still loads in read-only.
  });
});
