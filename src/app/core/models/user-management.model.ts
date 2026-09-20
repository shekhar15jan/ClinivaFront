export interface ManagedUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string;
  isActive: boolean;
  createdAt: string;
}

export type ManagedRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'NURSE';

export interface CreateManagedUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: ManagedRole | 'PATIENT';
  phone?: string;
  /** Sent because the API requires one. Staff sign in with an emailed code; an administrator can issue a new one with Reset password. */
  password: string;
}
