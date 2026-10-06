/**
 * The built-in roles' permissions, as the API grants them (RolePermissions.java), for tests that sign in a user by
 * role. Keep in step with the API's templates.
 */
const ALL = [
  'PATIENT_VIEW', 'PATIENT_EDIT', 'PATIENT_ADMIN', 'INSURANCE_DESK', 'CLINICAL_VIEW', 'CONSULTATION_EDIT', 'PRESCRIPTION_VIEW',
  'PRESCRIPTION_DELETE', 'APPOINTMENT_VIEW', 'APPOINTMENT_MANAGE', 'BILLING', 'BILL_VOID', 'MEDICINE_VIEW',
  'MEDICINE_MANAGE', 'STOCK_ISSUE', 'LAB_ORDER', 'LAB_PROCESS', 'LAB_VERIFY', 'LAB_MANAGE',
  'IMAGING_ORDER', 'IMAGING_PERFORM', 'IMAGING_REPORT', 'IMAGING_MANAGE', 'OT_SCHEDULE', 'OT_RECORD', 'OT_MANAGE', 'PAYOUT_MANAGE', 'PAYOUT_OWN', 'DOCTOR_MANAGE', 'DEPARTMENT_MANAGE', 'IPD_VIEW', 'IPD_MANAGE', 'WARD_MANAGE', 'NURSING_RECORD', 'MEDICATION_ORDER',
  'OPERATIONS_REPORTS',
  'FINANCE_REPORTS', 'WEBSITE_MANAGE',
  'AUDIT_VIEW', 'PRIVACY_MANAGE', 'CLINIC_SETTINGS', 'USER_MANAGE',
];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ALL,
  HOSPITAL_ADMIN: ['PATIENT_VIEW', 'PATIENT_EDIT', 'APPOINTMENT_VIEW', 'APPOINTMENT_MANAGE', 'MEDICINE_VIEW',
    'MEDICINE_MANAGE', 'DOCTOR_MANAGE', 'DEPARTMENT_MANAGE', 'OPERATIONS_REPORTS', 'WEBSITE_MANAGE', 'IPD_VIEW', 'IPD_MANAGE',
    'WARD_MANAGE', 'LAB_MANAGE', 'IMAGING_MANAGE', 'OT_SCHEDULE', 'OT_MANAGE'],
  ACCOUNTANT: ['PATIENT_VIEW', 'BILLING', 'BILL_VOID', 'MEDICINE_VIEW', 'OPERATIONS_REPORTS', 'FINANCE_REPORTS', 'IPD_VIEW', 'INSURANCE_DESK',
    'PAYOUT_MANAGE'],
  DOCTOR: ['PATIENT_VIEW', 'CLINICAL_VIEW', 'CONSULTATION_EDIT', 'PRESCRIPTION_VIEW', 'PRESCRIPTION_DELETE',
    'APPOINTMENT_VIEW', 'MEDICINE_VIEW', 'IPD_VIEW', 'IPD_MANAGE', 'NURSING_RECORD', 'MEDICATION_ORDER',
    'LAB_ORDER', 'LAB_VERIFY', 'IMAGING_ORDER', 'IMAGING_REPORT', 'OT_SCHEDULE', 'OT_RECORD', 'PAYOUT_OWN'],
  NURSE: ['PATIENT_VIEW', 'CLINICAL_VIEW', 'CONSULTATION_EDIT', 'PRESCRIPTION_VIEW', 'APPOINTMENT_VIEW', 'IPD_VIEW', 'IPD_MANAGE',
    'NURSING_RECORD', 'OT_RECORD'],
  RECEPTIONIST: ['PATIENT_VIEW', 'PATIENT_EDIT', 'APPOINTMENT_VIEW', 'APPOINTMENT_MANAGE', 'BILLING', 'MEDICINE_VIEW', 'IPD_VIEW',
    'IPD_MANAGE', 'INSURANCE_DESK'],
  PHARMACIST: ['PATIENT_VIEW', 'PRESCRIPTION_VIEW', 'MEDICINE_VIEW', 'MEDICINE_MANAGE', 'IPD_VIEW', 'STOCK_ISSUE'],
  LAB_TECHNICIAN: ['PATIENT_VIEW', 'LAB_PROCESS'],
  PATIENT: [],
};

/** A signed-in user of this role, with its permissions. */
export function userWithRole(role: string, extra: Record<string, unknown> = {}) {
  return { id: 'u1', email: `${role.toLowerCase()}@test.com`, role, roleName: role, permissions: ROLE_PERMISSIONS[role] ?? [], ...extra };
}

/** An AuthService stand-in for a user of this role: their permissions, and `can()` as the real one answers it. */
export function fakeAuth(role: string, extra: Record<string, unknown> = {}) {
  const user = userWithRole(role, extra);
  return { currentUserValue: user, can: (permission: string) => user.permissions.includes(permission) };
}
