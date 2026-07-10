export interface User {
  id: string;
  email: string;
  role: string;
  profile?: Record<string, string>;
}

export interface TenantInfo {
  id: string;
  name: string;
  logoUrl?: string;
  timezone?: string;
  activeModules: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenant: TenantInfo;
}

export type LoginStep = 'credentials' | 'otp';

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface TenantResolutionRequest {
  email: string;
}
