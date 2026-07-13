export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
export type ModuleStatus = 'PENDING' | 'TRIAL' | 'ACTIVE' | 'DISABLED' | 'EXPIRED';
export type LicenseSource = 'PLAN' | 'ADDON';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface Tenant {
  id: string;
  tenantId?: string;
  name: string;
  displayName?: string;
  domain?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status?: TenantStatus;
  timezone?: string;
  currency?: string;
  patientIdPrefix?: string;
  logoUrl?: string;
  trialEndsAt?: string;
}

export interface TenantModule {
  id?: string;
  moduleId?: string;
  moduleCode: string;
  moduleName: string;
  status: string;
  source?: string;
  isCore: boolean;
  activatedAt?: string;
  expiresAt?: string;
}

export interface Subscription {
  id?: string;
  tenantId?: string;
  productId?: string;
  planId?: string;
  planName: string;
  status: string;
  startDate?: string;
  endDate?: string;
  maxDoctors?: number;
  maxPatients?: number;
}

export interface TenantResolution {
  tenant: Tenant;
  modules: TenantModule[];
  subscription: Subscription;
}

export interface OnboardingStatus {
  step: string;
  completed: boolean;
}

export interface OnboardingStep {
  key: string;
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
}

export interface ClinicConfig {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  patientIdPrefix: string;
  timezone: string;
  facilities: string[];
}

export interface DepartmentConfig {
  name: string;
  description?: string;
}

export interface DoctorConfig {
  fullName: string;
  specialization: string;
  qualification: string;
  consultationFeeInPaisa: number;
  phone: string;
  email: string;
}

export interface StaffConfig {
  fullName: string;
  email: string;
  role: 'DOCTOR' | 'RECEPTIONIST' | 'NURSE';
}
