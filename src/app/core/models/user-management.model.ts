export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateManagedUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'NURSE' | 'PATIENT';
}
