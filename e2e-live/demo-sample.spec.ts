import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';
import { bearerOf, cliniva } from './helpers-cross';

/**
 * Demo sample data (requirement 62, CLIN-14). Only an environment started as DEMO offers the practice clinic, and only
 * to a clinic with no patients, doctors or appointments. In a DEMO environment this spec loads it from the dashboard
 * and checks the counts, the exercises and that it cannot be loaded twice; in any other environment it checks the
 * offer is absent and the API refuses, and says so in the report (annotation) rather than passing silently.
 */
test('the practice clinic is offered in a demo environment only, once, to an empty clinic', async ({ page, request }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const api = cliniva(request, await bearerOf(page));

  const status = (await api('GET', '/hms/demo/sample-data')).body.data as { available: boolean; empty: boolean; loaded: boolean };
  expect(status.empty, 'a new clinic is empty').toBe(true);
  await page.goto(`${code}/dashboard`);

  if (!status.available) {
    test.info().annotations.push({ type: 'not-demo', description: 'This environment is not DEMO: only the refusal was checked. Run against a DEMO backend (app.environment.kind=DEMO) for the load.' });
    await page.waitForTimeout(2000);
    await expect(page.locator('#dash-sample')).toHaveCount(0);
    const refused = await api('POST', '/hms/demo/sample-data', {});
    expect(refused.status, 'loading is refused outside a demo environment').toBeGreaterThanOrEqual(400);
    expect(refused.status).toBeLessThan(500);
    expect((await api('GET', '/hms/patients?size=5')).body.data.content ?? []).toHaveLength(0);
    return;
  }

  // Demo environment: the offer is on the dashboard of an empty clinic.
  await expect(page.locator('#dash-sample')).toBeVisible({ timeout: 20000 });
  const load = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/demo\/sample-data$/.test(r.url()));
  await page.locator('#dash-sample-load').click();
  expect((await load).ok(), 'sample data loaded').toBeTruthy();
  await expect(page.locator('#dash-exercises')).toContainText('2 doctors, 6 patients, 4 appointments', { timeout: 20000 });
  expect(await page.locator('#dash-exercises li').count(), 'exercises listed').toBeGreaterThanOrEqual(4);
  await expect(page.locator('#dash-sample')).toHaveCount(0);

  // The made-up records are really there, and say they are made up.
  await page.goto(`${code}/patients?q=Sample`);
  await expect(page.getByText('Sample Asha Patil').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
  await page.goto(`${code}/doctors`);
  await expect(page.getByText('Dr. Sample Sharma').filter({ visible: true }).first()).toBeVisible();

  // Once only: the clinic is no longer empty, the offer is gone and the API refuses a second load.
  const again = await api('POST', '/hms/demo/sample-data', {});
  expect(again.status, 'a second load is refused').toBeGreaterThanOrEqual(400);
  expect(again.status).toBeLessThan(500);
  const after = (await api('GET', '/hms/demo/sample-data')).body.data;
  expect(after.empty).toBe(false);
  expect(after.loaded).toBe(true);
  await page.goto(`${code}/dashboard`);
  await page.waitForTimeout(1500);
  await expect(page.locator('#dash-sample')).toHaveCount(0);
});
