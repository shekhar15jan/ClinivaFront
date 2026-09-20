import { STAFF_NAV, canSee } from './nav-items';

const ALL_MODULES = ['DASHBOARD', 'PATIENT', 'DOCTOR', 'APPOINTMENT', 'CONSULTATION', 'PRESCRIPTION', 'BILLING', 'PAYMENT', 'MEDICINE', 'REPORTS', 'HEALTH_PACKAGE', 'CONTACT', 'REVIEW', 'USER', 'AUDIT', 'SETTINGS'];

const labels = (role: string, modules: readonly string[]) => STAFF_NAV.filter((i) => canSee(i, role, modules)).map((i) => i.label);

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

  it('offers a receptionist the front desk screens and nothing the API would refuse', () => {
    const offered = labels('RECEPTIONIST', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(['Patients', 'Appointments', 'Billing', 'Payments', 'Pharmacy', 'Doctors', 'Health Packages']));
    for (const notTheirs of ['Users', 'Audit Log', 'Settings', 'Reports', 'Consultations', 'Prescriptions', 'Reviews', 'Contact Messages']) {
      expect(offered).not.toContain(notTheirs);
    }
  });

  it('offers a doctor clinical screens, not billing or administration', () => {
    const offered = labels('DOCTOR', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(['Patients', 'Appointments', 'Consultations', 'Prescriptions', 'Reports']));
    for (const notTheirs of ['Billing', 'Payments', 'Users', 'Audit Log', 'Settings']) {
      expect(offered).not.toContain(notTheirs);
    }
  });

  it('offers a nurse only what a nurse can use', () => {
    const offered = labels('NURSE', ALL_MODULES);
    expect(offered).toEqual(expect.arrayContaining(['Dashboard', 'Patients', 'Doctors', 'Consultations', 'Health Packages']));
    expect(offered).not.toContain('Billing');
    expect(offered).not.toContain('Appointments');
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
});
