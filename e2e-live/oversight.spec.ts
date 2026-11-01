import { expect, test } from '@playwright/test';
import { registerDoctor, registerPatient, signInAsNewAdmin } from './helpers';
import { CLOUDSUITE, HMS_CODE, bearerOf, cliniva, cloudSuite, operatorToken } from './helpers-cross';

/** Field names that mean a person (or private content). Only the clinic's and the product's own names are allowed. */
const PERSONAL_KEY = /name|email|phone|mobile|address|dob|birth|password|token|secret|diagnosis|history|notes|gender|aadhaar|abha/i;
const ALLOWED_KEYS = new Set(['tenantName', 'productName', 'label', 'planName']);

function personalKeys(node: unknown, path = '$'): string[] {
  if (Array.isArray(node)) return node.flatMap((v, i) => personalKeys(v, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
      (PERSONAL_KEY.test(k) && !ALLOWED_KEYS.has(k) ? [`${path}.${k}`] : []).concat(personalKeys(v, `${path}.${k}`)));
  }
  return [];
}

/**
 * Oversight console API: CloudSuite platform admin staff see counts and setup of every Cliniva clinic, never a person.
 * Read-only; the customer's own logins and platform helpdesk staff are refused.
 */
test.describe('Oversight, platform over Cliniva', () => {
  test('the platform admin finds the new clinic with right counts and no personal data; clinic and helpdesk tokens are refused @desktop', async ({ page, request }) => {
    // Step 1: a fresh clinic with one doctor and one patient made through the real forms.
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const code = admin.hospitalCode;
    const stamp = Date.now().toString().slice(-6);
    const doctorName = `Dr. Oversight ${stamp}`;
    const doctorEmail = `dr.oversight${stamp}@live-staff.test`;
    const doctorPhone = `98${stamp}41`.slice(0, 10);
    const patientName = `Oversight Patient ${stamp}`;
    const patientPhone = `97${stamp}42`.slice(0, 10);
    await registerDoctor(page, code, doctorName, doctorPhone, doctorEmail);
    await registerPatient(page, code, patientName, patientPhone);
    const clinicBearer = await bearerOf(page);

    // Step 2: the platform super admin reads the oversight tile for the Cliniva product.
    const operator = await operatorToken(request);
    const platform = cloudSuite(request, operator);
    const tiles = await platform('GET', '/platform/oversight/products');
    expect(tiles.status, 'oversight product tiles').toBe(200);
    const tile = (tiles.body as any[]).find((t) => t.productCode === HMS_CODE);
    expect(tile, 'Cliniva tile').toBeTruthy();
    expect(tile.state, 'Cliniva is reachable for oversight').toBe('OK');
    expect(tile.tenants).toBeGreaterThanOrEqual(1);

    // Step 3: the tenant list contains the new clinic with the right counts.
    const list = await platform('GET', `/platform/oversight/products/${tile.productId}/tenants`);
    expect(list.status, 'oversight tenant list').toBe(200);
    const mine = (list.body.tenants as any[]).find((t) => t.tenantId === admin.tenantUuid || String(t.code).toLowerCase() === code.toLowerCase());
    expect(mine, `clinic ${code} in the oversight list`).toBeTruthy();
    expect(mine.patients, 'patients counted').toBe(1);
    expect(mine.doctors, 'doctors counted').toBe(1);
    expect(mine.usersTotal, 'the owner and the doctor login').toBeGreaterThanOrEqual(2);
    expect(mine.status).toBeTruthy();
    expect(mine.tenantName, 'platform name added to the clinic').toContain('Live Clinic');

    // Step 4: the single-clinic view agrees.
    const one = await platform('GET', `/platform/oversight/products/${tile.productId}/tenants/${mine.tenantId}`);
    expect(one.status, 'oversight one clinic').toBe(200);
    expect(one.body.tenant.patients).toBe(1);
    expect(one.body.tenant.doctors).toBe(1);
    expect((await platform('GET', `/platform/oversight/products/${tile.productId}/tenants/00000000-0000-0000-0000-000000000000`)).status).toBe(404);

    // Step 5: nothing personal anywhere in what staff receive: no personal field names, and none of the real values we typed in.
    const everything = [tiles, list, one];
    for (const r of everything) {
      expect(personalKeys(r.body), 'personal field names in the oversight answer').toEqual([]);
      for (const secret of [patientName, patientPhone, doctorName, doctorPhone, doctorEmail, admin.adminEmail, `frontdesk@`, 'Live Admin']) {
        expect(r.text, `oversight leaks "${secret}"`).not.toContain(secret);
      }
    }

    // Step 6: refused callers. The clinic owner's own token, no token, and a platform helpdesk member.
    for (const path of ['/platform/oversight/products', `/platform/oversight/products/${tile.productId}/tenants`, `/platform/oversight/products/${tile.productId}/tenants/${mine.tenantId}`]) {
      const asClinic = await request.get(`${CLOUDSUITE}${path}`, { headers: { Authorization: clinicBearer } });
      expect([401, 403], `clinic owner token on ${path}`).toContain(asClinic.status());
      expect([401, 403], `no token on ${path}`).toContain((await cloudSuite(request)('GET', path)).status);
    }
    // The product side of oversight (called by the platform with a product key) is closed to a clinic owner too.
    const productSide = await cliniva(request, clinicBearer)('GET', '/hms/internal/oversight/tenants');
    expect([401, 403], 'clinic owner on the product oversight endpoint').toContain(productSide.status);
    expect([401, 403], 'anonymous on the product oversight endpoint').toContain((await cliniva(request)('GET', '/hms/internal/oversight/tenants')).status);

    // Step 7: a helpdesk staff member (made by the super admin) is refused too. A new platform account may need a
    // password change before it can sign in; then this part is skipped and said so.
    const helpdeskEmail = `helpdesk${stamp}@live-staff.test`;
    const helpdeskPassword = `Help#${stamp}Aa1`;
    const created = await platform('POST', '/platform/users', { email: helpdeskEmail, name: 'Live Helpdesk', password: helpdeskPassword, roleCode: 'HELPDESK' });
    expect(created.status, `helpdesk account created: ${created.text.slice(0, 160)}`).toBeLessThan(300);
    const signIn = await request.post(`${CLOUDSUITE}/auth/login`, { data: { email: helpdeskEmail, password: helpdeskPassword } });
    if (signIn.ok()) {
      const helpdesk = cloudSuite(request, (await signIn.json()).data.accessToken);
      for (const path of ['/platform/oversight/products', `/platform/oversight/products/${tile.productId}/tenants`, `/platform/oversight/products/${tile.productId}/tenants/${mine.tenantId}`]) {
        expect(await helpdesk('GET', path).then((r) => r.status), `helpdesk on ${path}`).toBe(403);
      }
    } else {
      test.info().annotations.push({ type: 'skipped-part', description: `helpdesk sign-in answered ${signIn.status()}; helpdesk refusal not checked` });
    }
    // Clean up the helpdesk account.
    const id = created.body?.id ?? created.body?.data?.id;
    if (id) await platform('POST', `/platform/users/${id}/deactivate`);
  });
});
