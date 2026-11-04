import { expect, test } from '@playwright/test';
import { completePaidVisit, mailsTo, operatorLogin, signInAsNewAdmin } from './helpers';

/**
 * Cliniva -> Accounting on the local Docker stack (INFR local deploy): a company is made on CloudSuite and signed in to Accounting
 * (4202), its plan is switched, a clinic is linked to it, a visit is billed and paid in Cliniva, and the vouchers and GSTR-1 show it.
 * Needs the sample Accounting plans (node Accounting/accounting/scripts/e2e-integration.mjs creates them).
 * Also runs against staging: set CLOUDSUITE_API, ACCOUNTING_API (.../api/v1/accounting), ACCOUNTING_TENANT_API (.../api/v1), ACCOUNTING_FRONT,
 * CLINIVA_API, MAILPIT_API + MAILPIT_AUTH and CLOUDSUITE_ADMIN_PASSWORD like the other live specs. Nothing reads a database:
 * the INVENTORY module switch is proved through the Accounting inventory endpoint (200 on, 403 off).
 * Run headed: SLOWMO=250 npx playwright test -c playwright.live.config.ts e2e-live/accounting-link.spec.ts --headed
 */
const CS = process.env.CLOUDSUITE_API || 'http://127.0.0.1:8081/api/v1';
const AC = process.env.ACCOUNTING_API || 'http://127.0.0.1:8082/api/v1/accounting';
const AC_ROOT = process.env.ACCOUNTING_TENANT_API || 'http://127.0.0.1:8082/api/v1';
const FRONT = (process.env.ACCOUNTING_FRONT || 'http://localhost:4202').replace(/\/$/, '');
const OWNER_PW = 'Owner!Pass2026';
const OPERATOR_EMAIL = process.env.CLOUDSUITE_ADMIN_EMAIL || 'admin@codeatcloud.in';
const OPERATOR_PASSWORD = process.env.CLOUDSUITE_ADMIN_PASSWORD || 'admin';

function gstinOf(first14: string): string {
  const C = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sum = 0;
  for (let i = 0; i < 14; i++) { const p = C.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2); sum += Math.floor(p / 36) + (p % 36); }
  return first14 + C[(36 - (sum % 36)) % 36];
}

test('a Cliniva bill reaches the Accounting vouchers and GSTR-1', async ({ page, request, browser }) => {
  test.setTimeout(420000);
  const op = await operatorLogin(request, OPERATOR_EMAIL, OPERATOR_PASSWORD);
  const h = { Authorization: `Bearer ${op}` };
  const acct = (await (await request.get(`${CS}/platform/products`, { headers: h })).json()).data.find((p: any) => p.code === 'ACCT');
  const plans = Object.fromEntries((await (await request.get(`${CS}/platform/plans`, { headers: h, params: { productId: acct.id } })).json()).data.map((p: any) => [p.code, p.id]));
  // The sample plans (Inventory edition and plain) exist locally; on a stack without them the first Accounting plan is used and the module switch is skipped.
  const switching = !!(plans['ACCT_SAMPLE_INV'] && plans['ACCT_SAMPLE']);
  const startPlan = plans['ACCT_SAMPLE_INV'] || Object.values(plans)[0];
  expect(startPlan, 'an Accounting plan exists').toBeTruthy();

  // 1. A company on CloudSuite, signed in to Accounting.
  const stamp = Date.now().toString().slice(-6);
  const code = `CLNK-${stamp}`;
  const owner = `owner-${code.toLowerCase()}@example.test`;
  const pan = `CLNK${stamp.slice(0, 4)}F`;
  const made = await request.post(`${CS}/platform/tenants`, { headers: h, data: { tenantId: code, name: `Link Clinic Books ${code}`, adminEmail: owner, adminName: 'Owner',
    planId: startPlan, settings: { gstin: gstinOf(`27${pan}1Z`), gstStateCode: '27' } } });
  expect(made.status(), 'Accounting company created on CloudSuite').toBe(201);
  const companyId = (await made.json()).data.id as string;
  const mailBody = async (to: string, re: RegExp, since = 0) => {
    let out = '';
    await expect.poll(async () => {
      for (const m of await mailsTo(request, to)) {
        if (Date.parse(m.at) < since) continue;
        const hit = m.body.replace(/<[^>]+>/g, ' ').match(re);
        if (hit) { out = hit[1]; return true; }
      }
      return false;
    }, { timeout: 45000, message: `mail to ${to}` }).toBe(true);
    return out;
  };
  const temp = await mailBody(owner, /temporary password is:\s*(\S+)/i);
  await expect.poll(async () => (await request.get(`${AC_ROOT}/tenant/resolve?code=${code}`)).ok(), { timeout: 45000 }).toBe(true);

  const books = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const acc = await books.newPage();
  let bearer = '';
  acc.on('request', (r) => { const a = r.headers()['authorization']; if (a && r.url().includes('/api/v1/')) bearer = a; });
  await acc.goto(`${FRONT}/${code}/change-password`);
  await acc.fill('#cp-email', owner);
  await acc.fill('#cp-current', temp);
  await acc.fill('#cp-new', OWNER_PW);
  await acc.fill('#cp-confirm', OWNER_PW);
  await acc.click('button[type=submit]');
  await acc.waitForURL(/passwordChanged=1/);
  const since = Date.now() - 1000;
  await acc.fill('#email', owner);
  await acc.click('button[type=submit]');
  await acc.waitForURL(/\/otp/);
  const otp = await mailBody(owner, /sign-in code is:\s*(\d{6})/i, since);
  for (let i = 0; i < 6; i++) await acc.locator('input.otp-digit').nth(i).fill(otp[i]);
  await acc.click('button[type=submit]');
  await acc.waitForURL(/\/dashboard/);

  // 2. Plan modules switch (proved through the Accounting inventory endpoint: 200 with the INVENTORY module, 403 without).
  if (switching) {
    const inventoryOn = async () => (await request.get(`${AC}/inventory/items`, { headers: { Authorization: bearer } })).status() === 200;
    expect(await inventoryOn(), 'INVENTORY on the Inventory plan').toBe(true);
    await request.post(`${CS}/platform/tenants/${companyId}/products/${acct.id}/subscription/upgrade`, { headers: h, data: { newPlanId: plans['ACCT_SAMPLE'] } });
    await expect.poll(inventoryOn, { timeout: 30000, message: 'INVENTORY removed' }).toBe(false);
    await request.post(`${CS}/platform/tenants/${companyId}/products/${acct.id}/subscription/upgrade`, { headers: h, data: { newPlanId: plans['ACCT_SAMPLE_INV'] } });
    await expect.poll(inventoryOn, { timeout: 30000, message: 'INVENTORY back' }).toBe(true);
  }

  // 3. A clinic linked to that company; a visit billed and paid.
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  await page.goto(`${admin.hospitalCode}/accounting-link`);
  await page.fill('#al-company', companyId);
  await page.fill('#al-state-code', '27');
  if ((await page.locator('#al-enabled').innerText()).includes('off')) await page.click('#al-enabled');
  await page.click('#al-save');
  await expect(page.locator('#al-state')).toContainText('On.', { timeout: 15000 });
  const visit = await completePaidVisit(page, request, browser, admin.hospitalCode);
  await expect.poll(async () => {
    await page.goto(`${admin.hospitalCode}/accounting-link`);
    await page.waitForTimeout(1500);
    const t = (await page.locator('#al-events').innerText()).replace(/\s+/g, ' ');
    return /failed|pending/i.test(t) ? '' : t;
  }, { timeout: 120000, message: 'bill and payment events sent' }).toMatch(/INVOICE_ISSUED[^]*PAYMENT_RECEIVED|PAYMENT_RECEIVED[^]*INVOICE_ISSUED/);

  // 4. Accounting shows it.
  const get = async (path: string) => (await (await request.get(`${AC}${path}`, { headers: { Authorization: bearer } })).json()).data;
  const bill = visit.billNumber.replace(/-/g, '');
  await expect.poll(async () => JSON.stringify(await get('/vouchers?size=100')).includes(visit.patientName), { timeout: 60000, message: `voucher for bill ${visit.billNumber}` }).toBe(true);
  const month = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }).slice(0, 7);
  const taxable = JSON.stringify(await get(`/gst/gstr-1?month=${month}`));
  console.log('GSTR-1:', taxable.slice(0, 400));
  expect(taxable).toMatch(/"taxablePaise":\s*[1-9]/);
  await acc.goto(`${FRONT}/${code}/vouchers`);
  await expect(acc.getByText('Cliniva invoice issued').first()).toBeVisible({ timeout: 30000 });
  await acc.screenshot({ path: 'test-results/accounting-vouchers.png' });
  await acc.goto(`${FRONT}/${code}/gst`);
  await acc.waitForTimeout(2000);
  await acc.screenshot({ path: 'test-results/accounting-gst.png' });
  console.log(`LINKED clinic ${admin.hospitalCode} -> company ${code}; bill ${visit.billNumber}`);
});
