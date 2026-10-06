import { APIRequestContext, Browser, Page, expect, test } from '@playwright/test';
import { addStaffUser, registerDoctor, registerPatient, signInAsNewAdmin, signInWithOtp } from './helpers';

const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';

/**
 * Role-based access at the level of actions, on real services: in one hospital with every module, with a patient
 * admitted and a lab order, an imaging order and a surgery waiting, each built-in role signs in and is checked on the
 * screens where work is done (the buttons it is given and the ones it is not), and then on the API with its own
 * session (what the server lets it do, whatever the screen shows). The permissions of each role are written out here,
 * not read from the app, so the test notices if the app drifts. Screen-level access is in roles.spec.ts.
 */

const ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'PHARMACIST', 'LAB_TECHNICIAN'] as const;
type Role = (typeof ROLES)[number];

const ALL = '*';
const PERMS: Record<Role, string[]> = {
  ADMIN: [ALL],
  DOCTOR: ['PATIENT_VIEW', 'CLINICAL_VIEW', 'CONSULTATION_EDIT', 'PRESCRIPTION_VIEW', 'PRESCRIPTION_DELETE', 'APPOINTMENT_VIEW', 'MEDICINE_VIEW',
    'IPD_VIEW', 'IPD_MANAGE', 'NURSING_RECORD', 'MEDICATION_ORDER', 'LAB_ORDER', 'LAB_VERIFY', 'IMAGING_ORDER', 'IMAGING_REPORT', 'OT_SCHEDULE',
    'OT_RECORD', 'PAYOUT_OWN'],
  NURSE: ['PATIENT_VIEW', 'CLINICAL_VIEW', 'CONSULTATION_EDIT', 'PRESCRIPTION_VIEW', 'APPOINTMENT_VIEW', 'IPD_VIEW', 'IPD_MANAGE', 'NURSING_RECORD',
    'OT_RECORD'],
  RECEPTIONIST: ['PATIENT_VIEW', 'PATIENT_EDIT', 'APPOINTMENT_VIEW', 'APPOINTMENT_MANAGE', 'BILLING', 'MEDICINE_VIEW', 'IPD_VIEW', 'IPD_MANAGE',
    'INSURANCE_DESK'],
  HOSPITAL_ADMIN: ['PATIENT_VIEW', 'PATIENT_EDIT', 'APPOINTMENT_VIEW', 'APPOINTMENT_MANAGE', 'MEDICINE_VIEW', 'MEDICINE_MANAGE', 'DOCTOR_MANAGE',
    'DEPARTMENT_MANAGE', 'OPERATIONS_REPORTS', 'WEBSITE_MANAGE', 'IPD_VIEW', 'IPD_MANAGE', 'WARD_MANAGE', 'LAB_MANAGE', 'IMAGING_MANAGE',
    'OT_SCHEDULE', 'OT_MANAGE'],
  ACCOUNTANT: ['PATIENT_VIEW', 'BILLING', 'BILL_VOID', 'MEDICINE_VIEW', 'OPERATIONS_REPORTS', 'FINANCE_REPORTS', 'IPD_VIEW', 'INSURANCE_DESK',
    'PAYOUT_MANAGE'],
  PHARMACIST: ['PATIENT_VIEW', 'PRESCRIPTION_VIEW', 'MEDICINE_VIEW', 'MEDICINE_MANAGE', 'IPD_VIEW', 'STOCK_ISSUE'],
  LAB_TECHNICIAN: ['PATIENT_VIEW', 'LAB_PROCESS'],
};
const has = (role: Role, ...any: string[]) => PERMS[role].includes(ALL) || any.some((p) => PERMS[role].includes(p));

interface Seed { code: string; patientId: string; stayId: string; labOrderId: string; imagingOrderId: string; imagingItemId: string; surgeryId: string }

/** A screen and the buttons on it: each shown exactly when the role holds one of its permissions. */
interface Screen { name: string; path: (s: Seed) => string; opens: string[]; buttons: { css: string; perms: string[]; label: string }[] }

const SCREENS: Screen[] = [
  { name: 'patient', path: (s) => `patients/${s.patientId}`, opens: ['PATIENT_VIEW'], buttons: [
    { css: '#order-lab', perms: ['LAB_ORDER'], label: 'Order lab tests' },
    { css: '#order-imaging', perms: ['IMAGING_ORDER'], label: 'Order imaging' },
    { css: '#book-surgery', perms: ['OT_SCHEDULE'], label: 'Book surgery' },
    { css: '#edit-abha', perms: ['PATIENT_EDIT'], label: 'Edit ABHA' },
  ] },
  { name: 'stay', path: (s) => `ipd/admissions/${s.stayId}`, opens: ['IPD_VIEW'], buttons: [
    { css: '#action-move', perms: ['IPD_MANAGE'], label: 'Move bed' },
    { css: '#action-charge', perms: ['IPD_MANAGE'], label: 'Add charge' },
    { css: '#action-insurance', perms: ['INSURANCE_DESK'], label: 'Insurance' },
    { css: '#action-surgery', perms: ['OT_SCHEDULE'], label: 'Book surgery' },
    { css: '#action-imaging', perms: ['IMAGING_ORDER'], label: 'Order imaging' },
    { css: '#action-lab', perms: ['LAB_ORDER'], label: 'Order tests' },
    { css: '#action-issue', perms: ['STOCK_ISSUE'], label: 'Issue medicines' },
    { css: '#action-advance', perms: ['BILLING'], label: 'Take advance' },
    { css: '#action-summary', perms: ['CONSULTATION_EDIT'], label: 'Discharge summary' },
  ] },
  { name: 'lab order', path: (s) => `lab/${s.labOrderId}`, opens: ['LAB_ORDER', 'LAB_PROCESS', 'LAB_VERIFY', 'LAB_MANAGE', 'BILLING'], buttons: [
    { css: '#lab-collect', perms: ['LAB_PROCESS'], label: 'Collect samples' },
    { css: '#lab-bill', perms: ['BILLING'], label: 'Bill' },
  ] },
  { name: 'imaging order', path: (s) => `radiology/${s.imagingOrderId}`,
    opens: ['IMAGING_ORDER', 'IMAGING_PERFORM', 'IMAGING_REPORT', 'IMAGING_MANAGE', 'BILLING'], buttons: [
      { css: '[id^="done-"]', perms: ['IMAGING_PERFORM'], label: 'Mark done' },
      { css: '[id^="schedule-"]', perms: ['IMAGING_PERFORM'], label: 'Give a time' },
      { css: '#rad-bill', perms: ['BILLING'], label: 'Bill' },
    ] },
  { name: 'surgery', path: (s) => `ot/${s.surgeryId}`, opens: ['OT_SCHEDULE', 'OT_RECORD', 'OT_MANAGE', 'BILLING'], buttons: [
    { css: '#ot-cancel', perms: ['OT_SCHEDULE'], label: 'Cancel surgery' },
  ] },
];

/** What the server must let each role do, or refuse it, with that role's own session. */
interface ApiRule { name: string; perms: string[]; method: string; path: (s: Seed) => string; body?: (s: Seed) => object }
const API_RULES: ApiRule[] = [
  { name: 'order lab tests', perms: ['LAB_ORDER'], method: 'POST', path: () => '/hms/lab/orders',
    body: (s) => ({ patientId: s.patientId, testIds: [LAB_TEST_ID] }) },
  { name: 'collect samples', perms: ['LAB_PROCESS'], method: 'POST', path: (s) => `/hms/lab/orders/${s.labOrderId}/collect` },
  { name: 'bill an outpatient\'s tests', perms: ['BILLING'], method: 'POST', path: (s) => `/hms/lab/orders/${s.labOrderId}/bill`, body: () => ({ taxInPaisa: 0 }) },
  { name: 'set up the lab catalog', perms: ['LAB_MANAGE'], method: 'POST', path: () => '/hms/lab/tests/starter' },
  { name: 'do an imaging study', perms: ['IMAGING_PERFORM'], method: 'POST', path: (s) => `/hms/radiology/items/${s.imagingItemId}/done`, body: () => ({}) },
  { name: 'take surgical consent', perms: ['OT_RECORD'], method: 'POST', path: (s) => `/hms/ot/surgeries/${s.surgeryId}/consent` },
  { name: 'add an operation theatre', perms: ['OT_MANAGE'], method: 'POST', path: () => '/hms/ot/theatres',
    body: () => ({ name: `RBAC OT ${Date.now()}` }) },
  { name: 'add a ward', perms: ['WARD_MANAGE'], method: 'POST', path: () => '/hms/ipd/wards',
    body: () => ({ name: `RBAC ward ${Date.now()}`, wardType: 'GENERAL', dailyRateInPaisa: 0 }) },
  { name: 'add a charge to a stay', perms: ['IPD_MANAGE'], method: 'POST', path: (s) => `/hms/ipd/admissions/${s.stayId}/charges`,
    body: () => ({ category: 'OTHER', description: 'RBAC check', quantity: 1, unitPriceInPaisa: 100 }) },
  { name: 'read doctor payout rules', perms: ['PAYOUT_MANAGE'], method: 'GET', path: () => '/hms/payouts/rules' },
  { name: 'read hospital analytics', perms: ['OPERATIONS_REPORTS', 'FINANCE_REPORTS'], method: 'GET', path: () => '/hms/analytics' },
  { name: 'read the HR link settings', perms: ['CLINIC_SETTINGS'], method: 'GET', path: () => '/hms/hr-link' },
  { name: 'read the audit log', perms: ['AUDIT_VIEW'], method: 'GET', path: () => '/hms/audit-logs' },
  { name: 'list staff users', perms: ['USER_MANAGE'], method: 'GET', path: () => '/hms/users' },
  // The visit list (dates, doctor, status) is the front desk's too; the consultations themselves are clinical.
  { name: 'read a patient\'s consultations', perms: ['CLINICAL_VIEW'], method: 'GET', path: (s) => `/hms/consultations/patient/${s.patientId}` },
];
let LAB_TEST_ID = '';

/** The bearer token of a signed-in page, taken from its own API calls. */
async function bearerOf(page: Page): Promise<string> {
  const request = page.waitForRequest((r) => r.url().includes('/api/v1/') && !!r.headers()['authorization'], { timeout: 20000 });
  await page.reload();
  return (await request).headers()['authorization'];
}

async function api(request: APIRequestContext, bearer: string, method: string, path: string, body?: object) {
  return request.fetch(`${CLINIVA}${path}`, { method, headers: { Authorization: bearer, 'Content-Type': 'application/json' }, data: body });
}

async function data(res: Awaited<ReturnType<typeof api>>, what: string) {
  expect(res.ok(), `${what} (HTTP ${res.status()}: ${(await res.text()).slice(0, 160)})`).toBeTruthy();
  return (await res.json()).data;
}

/** The hospital, set up once by its owner: a doctor, a patient admitted, and work waiting in the lab, radiology and theatre. */
async function seed(page: Page, request: APIRequestContext): Promise<Seed> {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  await registerDoctor(page, code, `RBAC Doctor ${stamp}`, `93${stamp}71`.slice(0, 10));
  await registerPatient(page, code, `RBAC Patient ${stamp}`, `92${stamp}72`.slice(0, 10));
  const bearer = await bearerOf(page);
  const doctors = await data(await api(request, bearer, 'GET', '/hms/doctors?page=0&size=20'), 'doctors');
  const doctorId = (doctors.content ?? doctors)[0].id;
  const patients = await data(await api(request, bearer, 'GET', '/hms/patients?page=0&size=20&sort=createdAt,desc'), 'patients');
  const patientId = (patients.content ?? patients).find((p: { fullName: string }) => p.fullName.includes(stamp)).id;

  const ward = await data(await api(request, bearer, 'POST', '/hms/ipd/wards', { name: `RBAC ward ${stamp}`, wardType: 'GENERAL', dailyRateInPaisa: 100000 }), 'ward');
  const beds = await data(await api(request, bearer, 'POST', `/hms/ipd/wards/${ward.id}/beds`, { bedNumbers: ['R1'] }), 'bed');
  const stay = await data(await api(request, bearer, 'POST', '/hms/ipd/admissions', { patientId, doctorId, bedId: beds.beds[0].id,
    admissionType: 'PLANNED', reason: 'RBAC check' }), 'admission');

  const tests = await data(await api(request, bearer, 'POST', '/hms/lab/tests/starter'), 'lab catalog');
  LAB_TEST_ID = tests.find((t: { code: string }) => t.code === 'CBC').id;
  const lab = await data(await api(request, bearer, 'POST', '/hms/lab/orders', { patientId, doctorId, testIds: [LAB_TEST_ID] }), 'lab order');

  const studies = await data(await api(request, bearer, 'POST', '/hms/radiology/studies/starter'), 'imaging catalog');
  const xray = studies.find((t: { code: string }) => t.code === 'XR-CHEST').id;
  const imaging = await data(await api(request, bearer, 'POST', '/hms/radiology/orders', { patientId, doctorId, studyIds: [xray] }), 'imaging order');

  const theatre = await data(await api(request, bearer, 'POST', '/hms/ot/theatres', { name: `RBAC OT ${stamp}` }), 'theatre');
  const day = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  const surgery = await data(await api(request, bearer, 'POST', '/hms/ot/surgeries', { patientId, theatreId: theatre.id, surgeonId: doctorId,
    procedureName: 'Excision of lipoma', anaesthesiaType: 'LOCAL', scheduledStart: `${day}T09:00:00`, expectedMinutes: 30 }), 'surgery');

  return { code, patientId, stayId: stay.id, labOrderId: lab.id, imagingOrderId: imaging.id, imagingItemId: imaging.items[0].id, surgeryId: surgery.id };
}

let SEED: Seed;
let OWNER_PAGE: Page;

// Each role is checked even when another fails (a failure starts a new worker, which sets up a new hospital).
test.describe.configure({ mode: 'default' });

test.beforeAll(async ({ browser, request }) => {
  test.setTimeout(240000);
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  OWNER_PAGE = await context.newPage();
  SEED = await seed(OWNER_PAGE, request);
});

async function signedIn(role: Role, browser: Browser, request: APIRequestContext): Promise<Page> {
  if (role === 'ADMIN') return OWNER_PAGE;
  const email = `rbac.${role.toLowerCase()}${Date.now().toString().slice(-6)}@live-staff.test`;
  await addStaffUser(OWNER_PAGE, SEED.code, { firstName: 'Rbac', lastName: role.replace(/_/g, ' '), email, role });
  // The owner's window (every menu) is done for now; blank it so the only menu on screen is this role's.
  await OWNER_PAGE.goto('about:blank');
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  await signInWithOtp(page, request, email);
  return page;
}

for (const role of ROLES) {
  test(`${role.toLowerCase()}: given exactly its actions on each screen, and the server agrees @desktop`, async ({ browser, request }) => {
    test.setTimeout(300000);
    const page = await signedIn(role, browser, request);
    const failures: string[] = [];

    // The screens where the work is done: each button shown exactly when the role may use it.
    for (const screen of SCREENS) {
      if (!has(role, ...screen.opens)) continue;   // the screen itself is closed to the role (roles.spec.ts)
      await page.goto(`${SEED.code}/${screen.path(SEED)}`);
      await page.waitForLoadState('networkidle');
      for (const b of screen.buttons) {
        const expected = has(role, ...b.perms);
        const count = await page.locator(b.css).count();
        if (expected && count === 0) failures.push(`${screen.name}: "${b.label}" missing for ${role}`);
        if (!expected && count > 0) failures.push(`${screen.name}: "${b.label}" shown to ${role} without ${b.perms.join('/')}`);
      }
      if (screen.name === 'surgery') {
        const consent = page.locator('#step-consent');
        const enabled = await consent.isEnabled();
        if (enabled !== has(role, 'OT_RECORD')) failures.push(`surgery: consent step ${enabled ? 'usable' : 'locked'} for ${role}`);
      }
    }

    // The server, with the role's own session: refused without the permission, done (or at least not refused) with it.
    const bearer = await bearerOf(page);
    for (const rule of API_RULES) {
      const allowed = has(role, ...rule.perms);
      if (allowed && rule.method !== 'GET') continue;   // changes are only tried where they must be refused
      const res = await api(request, bearer, rule.method, rule.path(SEED), rule.body?.(SEED));
      const refused = res.status() === 403;
      if (!allowed && !refused) failures.push(`API "${rule.name}": HTTP ${res.status()} for ${role}, expected 403`);
      if (allowed && !res.ok()) failures.push(`API "${rule.name}": HTTP ${res.status()} for ${role}, expected it allowed`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
    if (role !== 'ADMIN') await page.context().close();
  });
}
