export interface NavItem {
  /** The licensed module that has to be active for this link to be offered. */
  code: string;
  label: string;
  icon: string;
  /** Relative to the clinic: 'patients' is /:hospitalCode/patients. */
  route: string;
  /** Who is offered it. Left out means every staff role. */
  roles?: string[];
}

const ADMIN = ['ADMIN'];

/**
 * The staff menu, shared by the sidebar and the phone drawer. Roles match what the API allows, so nobody is
 * offered a screen that answers "Access Denied". Payments, Users, Audit Logs, Contacts and Reviews were built
 * but had no menu entry at all, so they could only be reached by typing the address.
 */
export const STAFF_NAV: NavItem[] = [
  { code: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
  { code: 'PATIENT', label: 'Patients', icon: 'person', route: 'patients', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
  { code: 'DOCTOR', label: 'Doctors', icon: 'medical_services', route: 'doctors' },
  { code: 'APPOINTMENT', label: 'Appointments', icon: 'event', route: 'appointments', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { code: 'CONSULTATION', label: 'Consultations', icon: 'stethoscope', route: 'consultations', roles: ['ADMIN', 'DOCTOR', 'NURSE'] },
  { code: 'PRESCRIPTION', label: 'Prescriptions', icon: 'receipt_long', route: 'prescriptions', roles: ['ADMIN', 'DOCTOR'] },
  { code: 'BILLING', label: 'Billing', icon: 'request_quote', route: 'billing', roles: ['ADMIN', 'RECEPTIONIST'] },
  { code: 'PAYMENT', label: 'Payments', icon: 'payments', route: 'payments', roles: ['ADMIN', 'RECEPTIONIST'] },
  { code: 'MEDICINE', label: 'Pharmacy', icon: 'medication', route: 'medicines', roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
  { code: 'REPORTS', label: 'Reports', icon: 'bar_chart', route: 'reports', roles: ['ADMIN', 'DOCTOR'] },
  { code: 'HEALTH_PACKAGE', label: 'Health Packages', icon: 'card_giftcard', route: 'health-packages' },
  { code: 'CONTACT', label: 'Contact Messages', icon: 'contact_mail', route: 'contacts', roles: ADMIN },
  { code: 'REVIEW', label: 'Reviews', icon: 'star', route: 'reviews', roles: ADMIN },
  { code: 'USER', label: 'Users', icon: 'group', route: 'users', roles: ADMIN },
  { code: 'AUDIT', label: 'Audit Log', icon: 'history', route: 'audit-logs', roles: ADMIN },
  { code: 'SETTINGS', label: 'Settings', icon: 'settings', route: 'settings', roles: ADMIN },
  { code: 'SETTINGS', label: 'Email Templates', icon: 'mail', route: 'settings/email-templates', roles: ADMIN },
];

/** Whether `role` should be offered `item` given the modules the clinic's plan includes. */
export function canSee(item: NavItem, role: string, activeModules: readonly string[]): boolean {
  if (item.roles && !item.roles.includes(role)) return false;
  return item.code === 'DASHBOARD' || activeModules.includes(item.code);
}
