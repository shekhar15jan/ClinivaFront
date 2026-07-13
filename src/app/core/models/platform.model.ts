export interface PlatformTenant {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  status: string;
  patientIdPrefix: string;
  timezone: string;
  createdAt: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  isActive: boolean;
  role: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface PlatformModule {
  id: string;
  productId: string;
  name: string;
  code: string;
  description: string;
  isCore: boolean;
  displayOrder: number;
}

export interface SubscriptionPlan {
  id: string;
  productId: string;
  name: string;
  code: string;
  description: string;
  priceInPaisa: number;
  billingCycle: string;
  maxDoctors: number;
  maxPatients: number;
  isActive: boolean;
}

export interface SupportTicket {
  id: string;
  tenantId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface PlatformReport {
  totalTenants: number;
  activeTenants: number;
  totalRevenueInPaisa: number;
  monthlyBreakdown: { month: string; billed: number; collected: number }[];
}
