import { Page, expect, test } from '@playwright/test';
import { BASE_PATH, addStaffUser, registerPatient, signInAsNewAdmin, signInWithOtp } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';

/**
 * Every role, on real services, in a clinic with every module: the menu offers exactly that role's screens,
 * each of them loads without a failing API call or console error, and typing the address of any other screen
 * does not open it. Written out here (not read from the app's menu table) so the test notices if the app drifts.
 */
const STAFF_SCREENS = [
  'dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'billing', 'payments',
  'medicines', 'reports', 'health-packages', 'contacts', 'reviews', 'users', 'audit-logs', 'settings',
  'departments', 'roles', 'emergency-access', 'ipd', 'ipd/admissions', 'nursing', 'stock', 'lab', 'insurance', 'abdm',
  'radiology',
] as const;
type Screen = (typeof STAFF_SCREENS)[number];

const ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'PHARMACIST', 'LAB_TECHNICIAN'] as const;
const ALLOWED: Record<(typeof ROLES)[number], Screen[]> = {
  ADMIN: [...STAFF_SCREENS],
  // Clinic reports are finance and operations; a doctor's own numbers are on the dashboard.
  DOCTOR: ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'medicines', 'health-packages',
    'ipd', 'ipd/admissions', 'nursing', 'stock', 'lab', 'radiology'],
  // Nurses read the day's queue and the prescriptions they give; they do not book or prescribe.
  NURSE: ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'health-packages', 'ipd',
    'ipd/admissions', 'nursing'],
  RECEPTIONIST: ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'payments', 'medicines', 'health-packages',
    'ipd', 'ipd/admissions', 'stock', 'lab', 'insurance', 'radiology'],
  // Runs the hospital: no money, no clinical records, no staff security.
  HOSPITAL_ADMIN: ['dashboard', 'patients', 'doctors', 'appointments', 'medicines', 'reports', 'health-packages',
    'departments', 'contacts', 'reviews', 'ipd', 'ipd/admissions', 'stock', 'lab', 'abdm', 'radiology'],
  ACCOUNTANT: ['dashboard', 'patients', 'doctors', 'billing', 'payments', 'medicines', 'reports', 'health-packages', 'ipd',
    'ipd/admissions', 'stock', 'lab', 'insurance', 'radiology'],
  PHARMACIST: ['dashboard', 'patients', 'doctors', 'prescriptions', 'medicines', 'health-packages', 'ipd', 'ipd/admissions', 'stock'],
  // Collects samples and enters results; sees patients' names, not their records.
  LAB_TECHNICIAN: ['dashboard', 'patients', 'doctors', 'health-packages', 'lab'],
};
const PATIENT_SCREENS = ['patient/dashboard', 'patient/appointments', 'patient/prescriptions', 'patient/bills', 'patient/profile'];

const menuLink = (page: Page, code: string, route: string) =>
  page.locator(`app-sidebar a[href="${BASE_PATH}/${code}/${route}"]`);

/** Records failing API calls and browser errors while `where` is set. */
function watch(page: Page) {
  const problems: string[] = [];
  const state = { where: '' };
  page.on('response', (r) => {
    if (state.where && r.url().includes('/api/v1/') && r.status() >= 400) {
      problems.push(`[${state.where}] ${r.status()} ${r.request().method()} ${r.url().split('/api/v1')[1]}`);
    }
  });
  page.on('console', (m) => {
    if (state.where && m.type() === 'error' && !/Failed to load resource|favicon|woff2/i.test(m.text())) {
      problems.push(`[${state.where}] console: ${m.text().slice(0, 160)}`);
    }
  });
  page.on('pageerror', (e) => state.where && problems.push(`[${state.where}] uncaught: ${e.message.slice(0, 160)}`));
  return { problems, state };
}

async function opens(page: Page, code: string, route: string) {
  await page.goto(`${code}/${route}`);
  await page.waitForLoadState('networkidle');
  await expect(page, `${route} opens (not bounced elsewhere)`).toHaveURL(new RegExp(`/${code}/${route}(\\?|$)`));
  await expect(page.locator('main, app-root').first()).toContainText(/\S/);
}

async function refused(page: Page, code: string, route: string) {
  await page.goto(`${code}/${route}`);
  await expect(page, `${route} is not opened for this role`).not.toHaveURL(new RegExp(`/${code}/${route}$`), { timeout: 15000 });
}

for (const role of ROLES) {
  test(`${role.toLowerCase()}: offered exactly their screens, each works, the rest stay closed`, { tag: '@desktop' }, async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    let staff = page;
    let context;
    if (role !== 'ADMIN') {
      const email = `${role.toLowerCase()}${Date.now().toString().slice(-6)}@live-staff.test`;
      await addStaffUser(page, admin.hospitalCode, { firstName: 'Role', lastName: role, email, role });
      context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
      staff = await context.newPage();
      await signInWithOtp(staff, request, email);
    }
    const code = admin.hospitalCode;
    const { problems, state } = watch(staff);

    await expect(menuLink(staff, code, 'dashboard')).toHaveCount(1, { timeout: 15000 });
    for (const screen of STAFF_SCREENS) {
      const offered = ALLOWED[role].includes(screen);
      await expect(menuLink(staff, code, screen), `${screen} ${offered ? 'is' : 'is not'} in the ${role} menu`)
        .toHaveCount(offered ? 1 : 0);
    }

    for (const screen of ALLOWED[role]) {
      state.where = `${role} ${screen}`;
      await opens(staff, code, screen);
    }
    state.where = '';
    expect(problems, problems.join('\n')).toEqual([]);

    for (const screen of STAFF_SCREENS.filter((s) => !ALLOWED[role].includes(s))) {
      await refused(staff, code, screen);
    }
    await context?.close();
  });
}

test('patient: the portal works, and no staff screen or staff data is reachable', { tag: '@desktop' }, async ({ page, request, browser }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const stamp = Date.now().toString().slice(-6);
  const email = `patient${stamp}@live-portal.test`;
  await registerPatient(page, admin.hospitalCode, `Portal Role ${stamp}`, `95${stamp}44`.slice(0, 10), email);

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const patient = await context.newPage();
  await signInWithOtp(patient, request, email);
  const code = admin.hospitalCode;
  const { problems, state } = watch(patient);

  for (const screen of PATIENT_SCREENS) {
    state.where = `PATIENT ${screen}`;
    await opens(patient, code, screen);
  }
  state.where = '';
  expect(problems, problems.join('\n')).toEqual([]);

  for (const screen of STAFF_SCREENS) {
    await refused(patient, code, screen);
  }

  // The server refuses too, not only the screens: the patient's own session cannot list clinic data. The token is
  // the one the portal itself sends (read from its requests), so the check uses the real portal session.
  let token: string | null = null;
  patient.on('request', (r) => {
    const auth = r.headers()['authorization'];
    if (auth?.startsWith('Bearer ')) token = auth.slice(7);
  });
  await patient.goto(`${code}/patient/bills`);
  await expect.poll(() => token, { message: 'the portal sends its session token' }).toBeTruthy();
  for (const path of ['/hms/patients', '/hms/bills', '/hms/users', '/hms/audit-logs', '/hms/payments/history', '/hms/reports/dashboard']) {
    const res = await request.get(`${CLINIVA}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    expect([401, 403], `${path} is refused to a patient (got ${res.status()})`).toContain(res.status());
  }
  await context.close();
});
