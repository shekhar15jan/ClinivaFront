export type TenantSubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';

export interface EffectiveLicense {
  tenantId: string;
  planName: string;
  planCode: string;
  status: TenantSubscriptionStatus;
  effectiveProducts: EffectiveProduct[];
  effectiveModules: EffectiveModule[];
  effectiveConstraints: ResourceConstraint[];
  effectiveFeatures: FeatureFlag[];
  purchasedAddons: PurchasedAddon[];
  trialEndsAt: string | null;
  subscriptionEndsAt: string;
}

export interface EffectiveProduct {
  productCode: string;
  productName: string;
  isActive: boolean;
}

export interface EffectiveModule {
  moduleCode: string;
  moduleName: string;
  isCore: boolean;
  source: 'CORE' | 'PLAN' | 'ADDON' | 'TRIAL';
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'DISABLED';
}

export interface ResourceConstraint {
  resourceCode: string;
  resourceName: string;
  limit: number;
  currentUsage: number;
  isUnlimited: boolean;
}

export interface FeatureFlag {
  featureCode: string;
  featureName: string;
  isEnabled: boolean;
  source: 'PLAN' | 'ADDON' | 'TRIAL';
}

export interface PurchasedAddon {
  addonCode: string;
  addonName: string;
  type: 'MODULE' | 'PRODUCT' | 'CAPACITY' | 'FEATURE';
  quantity: number;
  expiresAt: string | null;
}
