export interface NavItem {
  /** The plan module that has to be active for this link to be offered (the platform's subscription plans). */
  code: string;
  label: string;
  icon: string;
  /** Relative to the clinic: 'patients' is /:hospitalCode/patients. */
  route: string;
  /** The permissions that open it (any one). Left out means every staff member. */
  perms?: string[];
}

/**
 * The staff menu, shared by the sidebar, the phone drawer and the screen guard. Each entry needs a permission the
 * API also checks, so nobody is offered a screen that answers "Access Denied", and a clinic's custom roles get
 * exactly the screens their permissions allow.
 */
export const STAFF_NAV: NavItem[] = [
  { code: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
  { code: 'PATIENT', label: 'Patients', icon: 'person', route: 'patients', perms: ['PATIENT_VIEW'] },
  { code: 'DOCTOR', label: 'Doctors', icon: 'medical_services', route: 'doctors' },
  { code: 'APPOINTMENT', label: 'Appointments', icon: 'event', route: 'appointments', perms: ['APPOINTMENT_VIEW'] },
  { code: 'IPD', label: 'Beds', icon: 'bed', route: 'ipd', perms: ['IPD_VIEW'] },
  { code: 'IPD', label: 'Admissions', icon: 'hotel', route: 'ipd/admissions', perms: ['IPD_VIEW'] },
  { code: 'NURSING', label: 'Ward round', icon: 'clinical_notes', route: 'nursing', perms: ['NURSING_RECORD', 'MEDICATION_ORDER'] },
  { code: 'CONSULTATION', label: 'Consultations', icon: 'stethoscope', route: 'consultations', perms: ['CLINICAL_VIEW'] },
  { code: 'PRESCRIPTION', label: 'Prescriptions', icon: 'receipt_long', route: 'prescriptions', perms: ['PRESCRIPTION_VIEW'] },
  { code: 'BILLING', label: 'Billing', icon: 'request_quote', route: 'billing', perms: ['BILLING'] },
  { code: 'PAYMENT', label: 'Payments', icon: 'payments', route: 'payments', perms: ['BILLING'] },
  { code: 'MEDICINE', label: 'Pharmacy', icon: 'medication', route: 'medicines', perms: ['MEDICINE_VIEW'] },
  { code: 'PHARMACY_STOCK', label: 'Stock', icon: 'inventory_2', route: 'stock', perms: ['MEDICINE_VIEW'] },
  { code: 'REPORTS', label: 'Reports', icon: 'bar_chart', route: 'reports', perms: ['FINANCE_REPORTS', 'OPERATIONS_REPORTS'] },
  { code: 'HEALTH_PACKAGE', label: 'Health Packages', icon: 'card_giftcard', route: 'health-packages' },
  { code: 'DEPARTMENT', label: 'Departments', icon: 'domain', route: 'departments', perms: ['DEPARTMENT_MANAGE'] },
  { code: 'CONTACT', label: 'Contact Messages', icon: 'contact_mail', route: 'contacts', perms: ['WEBSITE_MANAGE'] },
  { code: 'REVIEW', label: 'Reviews', icon: 'star', route: 'reviews', perms: ['WEBSITE_MANAGE'] },
  { code: 'USER', label: 'Users', icon: 'group', route: 'users', perms: ['USER_MANAGE'] },
  { code: 'CUSTOM_ROLE', label: 'Roles', icon: 'admin_panel_settings', route: 'roles', perms: ['USER_MANAGE'] },
  { code: 'AUDIT', label: 'Audit Log', icon: 'history', route: 'audit-logs', perms: ['AUDIT_VIEW'] },
  { code: 'DEPARTMENT', label: 'Emergency Access', icon: 'emergency', route: 'emergency-access', perms: ['AUDIT_VIEW'] },
  { code: 'SETTINGS', label: 'Settings', icon: 'settings', route: 'settings', perms: ['CLINIC_SETTINGS'] },
  { code: 'SETTINGS', label: 'Email Templates', icon: 'mail', route: 'settings/email-templates', perms: ['CLINIC_SETTINGS'] },
];

/** Whether someone with these permissions should be offered `item`, given the modules the clinic's plan includes. */
export function canSee(item: NavItem, permissions: readonly string[], activeModules: readonly string[]): boolean {
  if (item.perms && !item.perms.some((p) => permissions.includes(p))) return false;
  return item.code === 'DASHBOARD' || activeModules.includes(item.code);
}
