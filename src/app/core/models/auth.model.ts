export interface User {
  id: string;
  email: string;
  role: string;
  /** What the clinic calls the role: a custom role's name (e.g. "Senior nurse") or the built-in one. */
  roleName?: string;
  /** What the API lets this user do (e.g. BILLING, CLINICAL_VIEW); the screens offer only these. */
  permissions?: string[];
  profile?: Record<string, string>;
  tenantId?: string;
  tenantCode?: string;
}

export interface TenantInfo {
  id: string;
  tenantId?: string;
  name: string;
  logoUrl?: string;
  timezone?: string;
  activeModules: string[];
  /** The clinic's home currency; every amount is in its minor units. */
  currency?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  tenant: TenantInfo;
}

export type LoginStep = 'credentials' | 'otp';

/** `tenantCode`: the clinic in the sign-in link; picks the right account when an email is used at several clinics. */
export interface SendOtpRequest {
  email: string;
  tenantCode?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  tenantCode?: string;
}

export interface TenantResolutionRequest {
  email: string;
}
