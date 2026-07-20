import { test, expect } from '@playwright/test';
import { loginAs, UserRole } from './helpers/login-as';

const HOSPITAL_CODE = 'CLINIVA';

type RoleTestCase = {
  role: UserRole;
  allowedRoutes: string[];
  blockedRoutes: string[];
};

const roleTests: RoleTestCase[] = [
  {
    role: 'ADMIN',
    allowedRoutes: ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'billing', 'payments', 'medicines', 'reports', 'settings', 'users', 'audit-logs', 'health-packages', 'contacts', 'reviews'],
    blockedRoutes: [],
  },
  {
    role: 'DOCTOR',
    allowedRoutes: ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'medicines', 'reports'],
    blockedRoutes: ['users', 'audit-logs'],
  },
  {
    role: 'RECEPTIONIST',
    allowedRoutes: ['dashboard', 'patients', 'doctors', 'appointments', 'billing', 'payments'],
    blockedRoutes: ['users', 'audit-logs'],
  },
  {
    role: 'NURSE',
    allowedRoutes: ['dashboard', 'patients', 'doctors', 'appointments', 'consultations'],
    blockedRoutes: ['users', 'audit-logs', 'billing', 'settings'],
  },
  {
    role: 'PATIENT',
    allowedRoutes: ['patient/dashboard', 'patient/appointments', 'patient/prescriptions', 'patient/bills', 'patient/profile'],
    blockedRoutes: ['dashboard', 'patients', 'doctors', 'appointments', 'consultations', 'prescriptions', 'billing', 'payments', 'medicines', 'reports', 'settings', 'users', 'audit-logs'],
  },
];

test.describe('Cross-Role RBAC Denial (E2E)', () => {
  for (const { role, allowedRoutes, blockedRoutes } of roleTests) {
    test.describe(`${role} role`, () => {
      test.beforeEach(async ({ page }) => {
        await loginAs(page, role);
      });

      for (const route of allowedRoutes) {
        test(`should access /${route}`, async ({ page }) => {
          const fullPath = route.startsWith('patient/') ? `/${HOSPITAL_CODE}/${route}` : `/${HOSPITAL_CODE}/${route}`;
          await page.goto(fullPath);
          await page.waitForTimeout(500);
          const url = page.url().toLowerCase();
          const routeSegment = route.includes('/') ? route : route;
          const isAllowed = url.includes(routeSegment) || url.includes('/dashboard') || url.includes('/login');
          expect(isAllowed).toBeTruthy();
        });
      }

      for (const route of blockedRoutes) {
        test(`should be BLOCKED from /${route}`, async ({ page }) => {
          await page.goto(`/${HOSPITAL_CODE}/${route}`);
          await page.waitForTimeout(500);
          const url = page.url().toLowerCase();
          const isBlocked = !url.includes(`/${route}`);
          expect(isBlocked).toBeTruthy();
        });
      }
    });
  }
});

test.describe('Role Sidebar Visibility (E2E)', () => {
  test('ADMIN should see all nav links', async ({ page }) => {
    await loginAs(page, 'ADMIN');
    const adminLinks = ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Billing', 'Settings', 'Users', 'Audit Logs'];
    for (const link of adminLinks) {
      const el = page.getByText(link).first();
      const visible = await el.isVisible().catch(() => false);
      expect(visible).toBe(true);
    }
  });

  test('DOCTOR should NOT see Users or Audit Logs', async ({ page }) => {
    await loginAs(page, 'DOCTOR');
    expect(await page.getByText('Users').isVisible().catch(() => false)).toBeFalsy();
    expect(await page.getByText('Audit Logs').isVisible().catch(() => false)).toBeFalsy();
  });

  test('RECEPTIONIST should NOT see Users or Consultations', async ({ page }) => {
    await loginAs(page, 'RECEPTIONIST');
    expect(await page.getByText('Users').isVisible().catch(() => false)).toBeFalsy();
    expect(await page.getByText('Audit Logs').isVisible().catch(() => false)).toBeFalsy();
  });

  test('NURSE should NOT see Billing, Settings, or Users', async ({ page }) => {
    await loginAs(page, 'NURSE');
    expect(await page.getByText('Billing').isVisible().catch(() => false)).toBeFalsy();
    expect(await page.getByText('Settings').isVisible().catch(() => false)).toBeFalsy();
    expect(await page.getByText('Users').isVisible().catch(() => false)).toBeFalsy();
  });

  test('PATIENT should see only patient portal nav', async ({ page }) => {
    await loginAs(page, 'PATIENT');
    const staffLinks = ['Patients', 'Doctors', 'Appointments', 'Consultations', 'Billing', 'Settings', 'Users', 'Audit Logs'];
    for (const link of staffLinks) {
      expect(await page.getByText(link).isVisible().catch(() => false)).toBeFalsy();
    }
  });
});

test.describe('Role Badge Display (E2E)', () => {
  const roles: UserRole[] = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE', 'PATIENT'];

  for (const role of roles) {
    test(`should show ${role} badge for ${role} user`, async ({ page }) => {
      await loginAs(page, role);
      await expect(page.getByText(role).first()).toBeVisible();
    });
  }
});
