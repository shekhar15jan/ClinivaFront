import { expect, test } from '@playwright/test';
import { provisionTenant, signInAsNewAdmin } from './helpers';
import { HMS_CODE, bearerOf, cliniva, cloudSuite, operatorToken } from './helpers-cross';

/**
 * Support access end to end: CodeAtCloud staff ask (CloudSuite), the clinic owner approves in the Cliniva UI, staff
 * get a one-time token, open the clinic as a read-only support session, the clinic sees the trail, the owner revokes
 * and the session stops at once. Also: one clinic's token is no use in another, and a token works once.
 */
test.describe('Support access, staff and clinic', () => {
  test('ask, approve, one-time token, read-only session, audit trail, revoke @desktop', async ({ page, request, browser }) => {
    // Step 1: clinic A with its owner signed in, and clinic B (another customer) with its own owner.
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const code = admin.hospitalCode;
    const ownerBearer = await bearerOf(page);
    const owner = cliniva(request, ownerBearer);
    const otherContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const otherPage = await otherContext.newPage();
    const adminB = await signInAsNewAdmin(otherPage, request, 'HMS_FULL');
    const ownerB = cliniva(request, await bearerOf(otherPage));
    const patientB = await ownerB('POST', '/hms/patients', { fullName: 'Clinic B Private Patient', gender: 'FEMALE',
      phone: `98${Date.now().toString().slice(-8)}`, dateOfBirth: '1990-01-01' });
    expect(patientB.status, 'patient made in clinic B').toBeLessThan(300);
    const patientBId: string = patientB.body.data.id;
    // A patient in clinic A for the support person to look at.
    const patientA = await owner('POST', '/hms/patients', { fullName: 'Clinic A Visible Patient', gender: 'MALE',
      phone: `97${Date.now().toString().slice(-8)}`, dateOfBirth: '1991-02-02' });
    expect(patientA.status, 'patient made in clinic A').toBeLessThan(300);

    // Step 2: CodeAtCloud staff (platform super admin) ask for support access to clinic A on Cliniva.
    const staff = cloudSuite(request, await operatorToken(request));
    const products = await staff('GET', '/platform/support-access/products');
    expect(products.status, 'staff may list products').toBe(200);
    expect((products.body as { code: string }[]).some((p) => p.code === HMS_CODE), 'Cliniva (HMS) is listed').toBeTruthy();
    const asked = await staff('POST', '/platform/support-access/requests', { tenantId: admin.tenantUuid, productCode: HMS_CODE, reason: 'Live test: help with billing set-up' });
    expect(asked.status, `support request created: ${asked.text.slice(0, 200)}`).toBe(201);
    const requestId: string = asked.body.id;
    expect(asked.body.status).toBe('REQUESTED');
    // No token before the owner approves.
    const early = await staff('POST', `/platform/support-access/requests/${requestId}/token`);
    expect(early.status, 'no token before approval').toBe(409);
    // Staff also ask for clinic B; it stays waiting, and its request id must be useless for clinic A.
    const askedB = await staff('POST', '/platform/support-access/requests', { tenantId: adminB.tenantUuid, productCode: HMS_CODE, reason: 'Live test: clinic B' });
    expect(askedB.status).toBe(201);
    expect((await staff('POST', `/platform/support-access/requests/${askedB.body.id}/token`)).status, 'clinic B request has no approval').toBe(409);

    // Step 3: the owner of clinic A sees the notice and the request in the UI and approves (default shorter duration).
    await page.goto(`${code}/dashboard`);
    await expect(page.locator('.support-waiting')).toBeVisible({ timeout: 20000 });
    await page.goto(`${code}/support-access`);
    await expect(page.locator(`[data-request="${requestId}"]`)).toBeVisible({ timeout: 15000 });
    const approved = page.waitForResponse((r) => r.request().method() === 'POST' && /support-access\/requests\/.+\/approve$/.test(r.url()));
    await page.getByRole('button', { name: 'Approve support access' }).click();
    expect((await approved).ok(), 'owner approves').toBeTruthy();
    await expect(page.locator(`[data-request="${requestId}"] .revoke`)).toBeVisible({ timeout: 15000 });

    // Clinic B's owner cannot approve (or revoke) clinic A's request, and A's request stays approved.
    for (const action of ['approve', 'revoke']) {
      const foreign = await ownerB('POST', `/hms/support-access/requests/${requestId}/${action}`, {});
      expect(foreign.status, `clinic B owner ${action}s clinic A's request`).toBeGreaterThanOrEqual(400);
    }
    const stillApproved = await staff('GET', `/platform/support-access/requests/${requestId}`);
    expect(stillApproved.body.status).toBe('APPROVED');

    // Step 4: staff issue the one-time token (the sign-in link carries it after #).
    const issued = await staff('POST', `/platform/support-access/requests/${requestId}/token`);
    expect(issued.status, `token issued: ${issued.text.slice(0, 120)}`).toBe(200);
    const token: string = issued.body.token;
    expect(token).toBeTruthy();
    if (issued.body.loginUrl) expect(issued.body.loginUrl).toContain('/support-login#token=');

    // Step 5: a new browser (the support person's) opens the Cliniva support-login URL and lands in clinic A with the support banner.
    const supportContext = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const support = await supportContext.newPage();
    let supportBearer = '';
    support.on('request', (r) => {
      const h = r.headers()['authorization'];
      if (h && r.url().includes('/api/v1/hms/')) supportBearer = h;
    });
    await support.goto(`support-login#token=${token}`);
    await expect.poll(() => support.url(), { timeout: 20000 }).toMatch(new RegExp(`/${code}/dashboard`, 'i'));
    const banner = support.locator('.support-session');
    await expect(banner).toBeVisible({ timeout: 15000 });
    await expect(banner).toContainText('Support session');
    // The token is gone from the address bar.
    expect(support.url()).not.toContain(token);

    // Step 6: reads work: the patients screen shows clinic A's patient, and never clinic B's.
    await support.goto(`${code}/patients`);
    await expect(support.locator('main')).toContainText('Clinic A Visible Patient', { timeout: 20000 });
    await expect(support.locator('main')).not.toContainText('Clinic B Private Patient');
    await expect.poll(() => supportBearer, { timeout: 10000 }).toBeTruthy();
    const sup = cliniva(request, supportBearer);
    const list = await sup('GET', '/hms/patients?page=0&size=100');
    expect(list.status, 'support reads patients').toBe(200);
    expect(list.text).toContain('Clinic A Visible Patient');
    expect(list.text).not.toContain('Clinic B Private Patient');

    // Step 7: a write is refused (support has no write approval) and nothing is created.
    const write = await sup('POST', '/hms/patients', { fullName: 'Support Must Not Create', gender: 'MALE', phone: '9876500123', dateOfBirth: '1990-01-01' });
    expect(write.status, 'support write refused').toBe(403);
    expect(write.text).toContain('SUPPORT_WRITE_NOT_ALLOWED');
    expect((await owner('GET', '/hms/patients?page=0&size=100&search=Support%20Must')).text).not.toContain('Support Must Not Create');
    // Owner-only screens are not open to support either (users, settings).
    expect((await sup('GET', '/hms/support-access/requests')).status, 'support cannot read the owner approval list').toBe(403);

    // Step 8: the token works once; a second try and a second token request both fail.
    const reuse = await cliniva(request)('POST', '/auth/support-login', { token });
    expect(reuse.status, 'a used token is refused').toBe(401);
    expect(reuse.text).toMatch(/SUPPORT_TOKEN_USED|SUPPORT_TOKEN_INVALID/);
    expect((await staff('POST', `/platform/support-access/requests/${requestId}/token`)).status, 'no new token while a session is open').toBe(409);

    // Step 9: the session cannot be used on another clinic: A's support bearer sees none of B's data, and B's patient id is not found.
    const crossRead = await sup('GET', `/hms/patients/${patientBId}`);
    expect([403, 404], 'clinic A support session reads clinic B patient').toContain(crossRead.status);
    // A bearer whose tenant claim is changed to clinic B is refused (signature breaks).
    const [head, payload, sig] = supportBearer.replace('Bearer ', '').split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const forged = `Bearer ${head}.${Buffer.from(JSON.stringify({ ...claims, tenantId: adminB.tenantUuid })).toString('base64url')}.${sig}`;
    expect((await cliniva(request, forged)('GET', '/hms/patients')).status, 'forged tenant claim').toBe(401);

    // Step 10: the owner reads the audit log in the UI and through the API: the session start and the reads are listed.
    await expect
      .poll(async () => {
        const log = await owner('GET', '/hms/support-access/log');
        const clinic = (log.body?.data?.clinic ?? []) as { event: string; method?: string; path?: string }[];
        return clinic.some((e) => e.event === 'SESSION_START') && clinic.some((e) => e.event === 'ACTION' && e.method === 'GET' && /patients/.test(e.path ?? ''));
      }, { timeout: 20000, message: 'clinic audit shows the session start and a patients read' })
      .toBe(true);
    const platformTrail = (await owner('GET', '/hms/support-access/log')).body.data.platform as { action: string }[];
    const actions = platformTrail.map((e) => e.action);
    expect(actions, 'platform trail: asked, approved, token issued').toEqual(expect.arrayContaining(['APPROVED', 'TOKEN_ISSUED']));
    await page.goto(`${code}/support-access`);
    await page.locator('.show-log').click();
    await expect(page.locator('#support-log')).toContainText('SESSION_START', { timeout: 15000 });
    await expect(page.locator('#support-log')).toContainText('APPROVED');
    await expect(page.locator(`[data-request="${requestId}"]`)).toContainText('Support is signed in now');

    // Step 11: the owner revokes; the support session stops at once (the next call and the next screen).
    const revoked = page.waitForResponse((r) => r.request().method() === 'POST' && /support-access\/requests\/.+\/revoke$/.test(r.url()));
    await page.locator(`[data-request="${requestId}"] .revoke`).click();
    expect((await revoked).ok(), 'owner revokes').toBeTruthy();
    await expect
      .poll(async () => (await sup('GET', '/hms/patients?page=0&size=1')).status, { timeout: 15000, message: 'support session ends after revoke' })
      .toBe(401);
    expect((await sup('GET', '/hms/patients?page=0&size=1')).text).toContain('SUPPORT_SESSION_ENDED');
    await support.goto(`${code}/patients`);
    await expect
      .poll(async () => /\/login|support-login/.test(support.url()) || (await support.locator('body').innerText()).toLowerCase().includes('ended')
        || !(await support.locator('main').innerText().catch(() => '')).includes('Clinic A Visible Patient'), { timeout: 20000 })
      .toBe(true);
    await expect(support.locator('main')).not.toContainText('Clinic A Visible Patient');
    // The platform agrees: the request is no longer approved, and the old token cannot start a session again.
    const after = await staff('GET', `/platform/support-access/requests/${requestId}`);
    expect(after.body.status).not.toBe('APPROVED');
    expect((await staff('POST', `/platform/support-access/requests/${requestId}/token`)).status, 'no token after revoke').toBe(409);
    expect((await cliniva(request)('POST', '/auth/support-login', { token })).status).toBe(401);
    // Clean up: cancel clinic B's waiting request.
    await staff('POST', `/platform/support-access/requests/${askedB.body.id}/cancel`);

    await supportContext.close();
    await otherContext.close();
  });

  test('a support token for one clinic is not accepted for another, and an unapproved or expired-looking token is refused @desktop', async ({ page, request }) => {
    // Step 1: two clinics, staff ask for A only.
    const adminA = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const adminB = await provisionTenant(request, 'HMS_FULL');
    const staff = cloudSuite(request, await operatorToken(request));
    const asked = await staff('POST', '/platform/support-access/requests', { tenantId: adminA.tenantUuid, productCode: HMS_CODE, reason: 'Live test: cross-clinic' });
    expect(asked.status).toBe(201);

    // Step 2: the owner of A approves through the API (the UI path is covered by the other test).
    const owner = cliniva(request, await bearerOf(page));
    const open = await owner('GET', '/hms/support-access/requests');
    expect(open.status).toBe(200);
    const approve = await owner('POST', `/hms/support-access/requests/${asked.body.id}/approve`, { minutes: 15 });
    expect(approve.status, 'approve for 15 minutes').toBe(200);
    const issued = await staff('POST', `/platform/support-access/requests/${asked.body.id}/token`);
    expect(issued.status).toBe(200);
    const token: string = issued.body.token;

    // Step 3: garbage and half a token are refused; the real token is for A: its session belongs to A only.
    const login = cliniva(request);
    expect((await login('POST', '/auth/support-login', { token: 'not-a-token' })).status).toBe(401);
    expect((await login('POST', '/auth/support-login', { token: token.slice(0, token.length - 4) })).status).toBe(401);
    expect((await login('POST', '/auth/support-login', {})).status).toBeGreaterThanOrEqual(400);
    const ok = await login('POST', '/auth/support-login', { token });
    expect(ok.status, 'real token works once').toBe(200);
    expect(ok.body.data.tenantId, 'the session is for clinic A').toBe(adminA.tenantUuid);
    expect(ok.body.data.tenantId).not.toBe(adminB.tenantUuid);
    expect(ok.body.data.role, 'platform super admin maps to the admin support role').toMatch(/^SUPPORT_/);
    // The permissions of a support session never include owner-only ones.
    expect(ok.body.data.permissions).not.toContain('USER_MANAGE');
    expect(ok.body.data.permissions).not.toContain('CLINIC_SETTINGS');
    expect((await login('POST', '/auth/support-login', { token })).status, 'second use of the token').toBe(401);

    // Step 4: end the session from the staff side; the clinic API refuses its bearer at once.
    const bearer = `Bearer ${ok.body.data.accessToken}`;
    expect((await cliniva(request, bearer)('GET', '/hms/patients?page=0&size=1')).status).toBe(200);
    expect((await staff('POST', `/platform/support-access/requests/${asked.body.id}/end`)).status).toBe(200);
    await expect
      .poll(async () => (await cliniva(request, bearer)('GET', '/hms/patients?page=0&size=1')).status, { timeout: 15000 })
      .toBe(401);
  });
});
