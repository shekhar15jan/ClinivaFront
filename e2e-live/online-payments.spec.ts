import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

test.describe('Online payments (Razorpay) settings, real backend', () => {
  test("a clinic saves its own Razorpay keys; the secret is never sent back; the webhook address is the clinic's", async ({ page, request }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const secret = `live-secret-${Date.now()}`;

    await page.goto(`${admin.hospitalCode}/settings`);
    await expect(page.locator('#settings-razorpay')).toContainText('Not set up', { timeout: 15000 });
    await expect(page.locator('#settingsRzpWebhookUrl')).toHaveValue(
      new RegExp(`/hms/payments/webhook/${admin.hospitalCode}$`, 'i'));

    // A key id without its secret is refused before anything is sent.
    await page.fill('#settingsRzpKeyId', 'rzp_test_LiveCheck123');
    await page.getByRole('button', { name: 'Save Settings' }).click();
    await expect(page.getByText('Enter the Razorpay key secret for this Key ID.')).toBeVisible();

    await page.fill('#settingsRzpSecret', secret);
    await page.fill('#settingsRzpWebhookSecret', 'live-hook-secret');
    const saved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/hms\/settings$/.test(r.url()));
    await page.getByRole('button', { name: 'Save Settings' }).click();
    const response = await saved;
    expect(response.ok(), `settings saved (${response.status()}: ${(await response.text()).slice(0, 200)})`).toBeTruthy();
    expect(await response.text(), 'the secret is not echoed back').not.toContain(secret);

    const loaded = page.waitForResponse((r) => r.request().method() === 'GET' && /\/hms\/settings(\?|$)/.test(r.url()));
    await page.reload();
    const body = await (await loaded).json();
    expect(JSON.stringify(body)).not.toContain(secret);
    expect(body.data.razorpayKeySecretSet).toBe(true);
    expect(body.data.razorpayWebhookSecretSet).toBe(true);

    await expect(page.locator('#settingsRzpKeyId')).toHaveValue('rzp_test_LiveCheck123', { timeout: 15000 });
    await expect(page.locator('#settingsRzpSecret')).toHaveValue('');
    await expect(page.locator('#settingsRzpSecret')).toHaveAttribute('placeholder', /Saved/);

    // Disconnecting removes the keys.
    await page.locator('#settings-rzp-remove').click();
    const removed = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/hms\/settings$/.test(r.url()));
    await page.getByRole('button', { name: 'Save Settings' }).click();
    const afterRemove = await (await removed).json();
    expect(afterRemove.data.razorpayKeyId ?? null).toBeNull();
    expect(afterRemove.data.razorpayKeySecretSet).toBe(false);
    await expect(page.locator('#settings-razorpay')).toContainText('Not set up');
  });
});
