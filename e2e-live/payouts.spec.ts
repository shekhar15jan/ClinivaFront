import { Page, expect, test } from '@playwright/test';
import { registerDoctor, signInAsNewAdmin } from './helpers';

/** Doctor payouts on real services: rules set for a doctor, a statement with a manual line and TDS, approved and paid. */
function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400 && !r.url().includes('/auth/refresh')) {
      problems.push(`${r.status()} ${r.request().method()} ${r.url().split('/api/v1')[1]}`);
    }
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message.slice(0, 160)}`));
  return problems;
}

test('a doctor payout from rules to a paid statement @desktop', async ({ page, request }) => {
  test.setTimeout(240000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const doctor = `Payee ${stamp}`;
  await registerDoctor(page, code, doctor, `86${stamp}85`.slice(0, 10));

  await page.goto(`${code}/payouts`);
  await page.locator('#tab-rules').click();
  const card = page.locator(`[data-doctor="${doctor}"]`);
  await card.getByRole('button', { name: 'Set rules' }).click();
  await card.locator('[data-source="CONSULTATION"]').getByRole('button', { name: 'Share %' }).click();
  await card.locator('[data-source="CONSULTATION"] input').fill('40');
  await card.locator('#save-rules').click();
  await expect(card).toContainText('40% of fee');

  await page.getByRole('button', { name: 'Statements' }).click();
  await page.locator('#payout-doctor').selectOption({ label: `Dr ${doctor}` });
  await page.locator('#payout-make').click();
  await expect(page.locator('#statement-status')).toHaveText('draft');

  await page.fill('#line-text', 'On-call allowance');
  await page.fill('#line-amount', '5000');
  await page.locator('#add-line').click();
  await expect(page.locator('#statement-gross')).toContainText('5,000');
  await expect(page.locator('#statement-net')).toContainText('4,500');
  await page.locator('#statement-approve').click();
  await expect(page.locator('#statement-status')).toHaveText('approved');
  await page.fill('#pay-reference', `UTR${stamp}`);
  await page.locator('#statement-pay').click();
  await expect(page.locator('#statement-status')).toHaveText('paid');
  await expect(page.locator('#statement-header')).toContainText(`UTR${stamp}`);
  expect(problems, problems.join('\n')).toEqual([]);
});
