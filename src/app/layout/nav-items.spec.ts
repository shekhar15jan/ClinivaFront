import { STAFF_NAV, canSee } from './nav-items';
import { ROLE_PERMISSIONS } from '../testing/role-permissions';

const ALL_MODULES = ['DASHBOARD', 'PATIENT', 'DOCTOR', 'APPOINTMENT', 'CONSULTATION', 'PRESCRIPTION', 'BILLING', 'PAYMENT', 'MEDICINE', 'REPORTS', 'HEALTH_PACKAGE', 'CONTACT', 'REVIEW', 'USER', 'AUDIT', 'SETTINGS', 'DEPARTMENT', 'CUSTOM_ROLE', 'IPD', 'NURSING', 'PHARMACY_STOCK', 'LAB', 'INSURANCE', 'ABDM', 'RADIOLOGY'];

const labels = (role: string, modules: readonly string[]) =>
  STAFF_NAV.filter((i) => canSee(i, ROLE_PERMISSIONS[role] ?? [], modules)).map((i) => i.label);

describe('staff menu', () => {
  it('has an entry for every screen a clinic uses, including the ones that had none', () => {
    const routes = STAFF_NAV.map((i) => i.route);
    for (const route of ['payments', 'users', 'audit-logs', 'contacts', 'reviews']) {
      expect(routes).toContain(route);
    }
  });

  it('has a unique route per entry, so the list can be tracked by it', () => {
    const routes = STAFF_NAV.map((i) => i.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('shows an administrator everything their plan includes', () => {
    expect(labels('ADMIN', ALL_MODULES)).toHaveLength(STAFF_NAV.length);
  });

  it('hides what the plan does not include, but always offers the dashboard', () => {
    expect(labels('ADMIN', [])).toEqual(['Dashboard']);
    expect(labels('ADMIN', ['PATIENT', 'DOCTOR', 'APPOINTMENT'])).toEqual(['Dashboard', 'Patients', 'Doctors', 'Appointments']);
  });

  it('offers departments, emergency access and roles only when the plan includes those modules', () => {
    const without = labels('ADMIN', ALL_MODULES.filter((m) => m !== 'DEPARTMENT' && m !== 'CUSTOM_ROLE'));
    for (const label of ['Departments', 'Emergency Access', 'Roles']) {
      expect(without).not.toContain(label);
    }
    expect(labels('ADMIN', ['DEPARTMENT'])).toEqual(['Dashboard', 'Departments', 'Emergency Access']);
    // Beds and admissions come with a plan for clinics with beds.
    expect(labels('ADMIN', ['IPD'])).toEqual(['Dashboard', 'Beds', 'Admissions']);
    expect(labels('PHARMACIST', ['IPD'])).toEqual(['Dashboard', 'Beds', 'Admissions']);
    expect(labels('PATIENT', ['IPD'])).toEqual(['Dashboard']);
    expect(labels('NURSE', ['IPD', 'NURSING'])).toEqual(['Dashboard', 'Beds', 'Admissions', 'Ward round']);
    expect(labels('RECEPTIONIST', ['IPD', 'NURSING'])).toEqual(['Dashboard', 'Beds', 'Admissions']);
    expect(labels('ADMIN', ['CUSTOM_ROLE'])).toEqual(['Dashboard', 'Roles']);
  });

  it('offers a receptionist the front desk screens and nothing the API would refuse', () => {
    const offered = labels('RECEPTIONIST', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(['Patients', 'Appointments', 'Billing', 'Payments', 'Pharmacy', 'Doctors', 'Health Packages']));
    for (const notTheirs of ['Users', 'Audit Log', 'Settings', 'Reports', 'Consultations', 'Prescriptions', 'Reviews', 'Contact Messages']) {
      expect(offered).not.toContain(notTheirs);
    }
  });

  it('offers a doctor clinical screens, not billing or administration', () => {
    const offered = labels('DOCTOR', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(['Patients', 'Appointments', 'Consultations', 'Prescriptions']));
    // Clinic reports are finance and operations; a doctor's own numbers are on the dashboard.
    for (const notTheirs of ['Billing', 'Payments', 'Users', 'Audit Log', 'Settings', 'Reports', 'Roles']) {
      expect(offered).not.toContain(notTheirs);
    }
  });

  it("offers a nurse the day's queue and prescriptions to read, and nothing of billing or administration", () => {
    const offered = labels('NURSE', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(
      ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Consultations', 'Prescriptions', 'Health Packages']));
    for (const label of ['Billing', 'Payments', 'Reports', 'Users', 'Settings', 'Audit Log']) {
      expect(offered).not.toContain(label);
    }
  });

  it('keeps administration for administrators', () => {
    for (const label of ['Users', 'Audit Log', 'Settings', 'Email Templates', 'Contact Messages', 'Reviews']) {
      expect(labels('ADMIN', ALL_MODULES)).toContain(label);
      expect(labels('RECEPTIONIST', ALL_MODULES)).not.toContain(label);
    }
  });

  it('offers nothing to an unknown role except the dashboard', () => {
    expect(labels('', ALL_MODULES)).toEqual(['Dashboard', 'Doctors', 'Health Packages']);
  });

  it('offers the accountant money screens and the hospital admin operations, neither clinical records', () => {
    const accountant = labels('ACCOUNTANT', ALL_MODULES);
    expect(accountant).toEqual(expect.arrayContaining(['Billing', 'Payments', 'Reports']));
    for (const label of ['Consultations', 'Prescriptions', 'Users', 'Settings', 'Appointments']) {
      expect(accountant).not.toContain(label);
    }
    const ops = labels('HOSPITAL_ADMIN', ALL_MODULES);
    expect(ops).toEqual(expect.arrayContaining(['Departments', 'Doctors', 'Appointments', 'Reports', 'Reviews']));
    for (const label of ['Billing', 'Consultations', 'Users', 'Roles', 'Settings', 'Audit Log']) {
      expect(ops).not.toContain(label);
    }
  });

  it('offers the pharmacist the pharmacy and prescriptions', () => {
    const offered = labels('PHARMACIST', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(['Pharmacy', 'Prescriptions', 'Patients']));
    for (const label of ['Billing', 'Consultations', 'Appointments', 'Users']) {
      expect(offered).not.toContain(label);
    }
  });

  it('gives a custom role exactly the screens of its permissions', () => {
    const offered = STAFF_NAV.filter((i) => canSee(i, ['PATIENT_VIEW', 'BILLING'], ALL_MODULES)).map((i) => i.label);
    expect(offered).toEqual(expect.arrayContaining(['Patients', 'Billing', 'Payments']));
    expect(offered).not.toContain('Consultations');
  });
});
