import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';
import { bearerOf, cliniva } from './helpers-cross';

/**
 * HR link address check (requirement 61, scan finding P-36): the address of the HR system must be https and on the
 * internet; addresses inside the server's own network, and names that point there, are refused, and a refused save
 * leaves the stored address exactly as it was. The save itself is also checked from the API with the same address so
 * a screen that hid the refusal would still be caught.
 */
const REFUSED = [
  { url: 'http://hr.example.com/cliniva', why: 'plain http' },
  { url: 'https://localhost/hook', why: 'loopback name' },
  { url: 'https://127.0.0.1/hook', why: 'loopback number' },
  { url: 'https://10.0.0.5/hook', why: 'private network number' },
  { url: 'https://192.168.1.20/hook', why: 'private network number' },
  { url: 'https://169.254.169.254/latest/meta-data', why: 'cloud metadata address' },
  { url: 'https://[::1]/hook', why: 'IPv6 loopback' },
  { url: 'https://127.0.0.1.nip.io/hook', why: 'a public name that points at loopback (rebinding)' },
];

test('the HR link refuses addresses inside the network and keeps the stored address unchanged', async ({ page, request }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;

  await page.goto(`${code}/hr-link`);
  await expect(page.locator('#hr-form')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#hr-state')).toContainText('Off.');
  const api = cliniva(request, await bearerOf(page));
  expect((await api('GET', '/hms/hr-link')).body.data.endpointUrl, 'nothing stored to begin with').toBeNull();

  for (const bad of REFUSED) {
    await page.fill('#hr-url', bad.url);
    await page.fill('#hr-secret', 'a-long-shared-secret-1234');
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/hms\/hr-link$/.test(r.url()));
    await page.locator('#hr-save').click();
    const res = await saved;
    expect(res.status(), `${bad.why}: ${bad.url} must be refused`).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    await expect(page.locator('[role="alert"]').filter({ hasText: /./ }).first()).toBeVisible();
    // Same address straight to the API: also refused.
    const direct = await api('PUT', '/hms/hr-link', { endpointUrl: bad.url, secret: 'a-long-shared-secret-1234', enabled: true, sendStaff: true, sendPayouts: true });
    expect(direct.status, `${bad.why} through the API`).toBeGreaterThanOrEqual(400);
    expect(direct.status).toBeLessThan(500);
  }

  // Nothing was stored and the link is still off.
  const after = (await api('GET', '/hms/hr-link')).body.data;
  expect(after.endpointUrl, 'a refused address is never stored').toBeNull();
  expect(after.enabled).toBe(false);
  await page.reload();
  await expect(page.locator('#hr-state')).toContainText('Off.');
  await expect(page.locator('#hr-url')).toHaveValue('');
});
