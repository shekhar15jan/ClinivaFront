export interface ManagedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string;
  isActive: boolean;
  createdAt: string;
  /** The clinic's own role, if the account has one (its base role is in `roles`). */
  customRoleId?: string | null;
  customRoleName?: string | null;
  /** The department they belong to; none means clinic-wide. */
  departmentId?: string | null;
  departmentName?: string | null;
}

export type ManagedRole = 'ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'ACCOUNTANT' | 'PHARMACIST';

export interface CreateManagedUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: ManagedRole | 'PATIENT';
  /** A custom role: the account gets its permissions; `role` is its base role. */
  customRoleId?: string | null;
  phone?: string;
  /** Sent because the API requires one. Staff sign in with an emailed code; an administrator can issue a new one with Reset password. */
  password: string;
}

/** A permission the API checks, e.g. BILLING. */
export interface PermissionInfo {
  code: string;
  group: string;
  label: string;
  /** Stays with the clinic owner; cannot be put in a custom role. */
  ownerOnly: boolean;
}

export interface BuiltInRole {
  role: ManagedRole;
  label: string;
  permissions: string[];
}

export interface CustomRole {
  id: string;
  name: string;
  baseRole: ManagedRole;
  baseRoleLabel: string;
  permissions: string[];
  staffCount: number;
}

export interface RolesOverview {
  permissions: PermissionInfo[];
  builtInRoles: BuiltInRole[];
  customRoles: CustomRole[];
}

export interface CustomRoleRequest {
  name: string;
  baseRole: ManagedRole;
  permissions: string[];
}
