export interface User {
  id: string;
  email: string;
  role: string;
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
