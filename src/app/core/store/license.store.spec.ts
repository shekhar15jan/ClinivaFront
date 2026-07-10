import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { LicenseStore } from './license.store';
import { EffectiveLicenseService } from '../services/effective-license.service';

describe('LicenseStore', () => {
  let store: LicenseStore;
  let mockLicenseService: Partial<EffectiveLicenseService>;

  beforeEach(() => {
    mockLicenseService = {
      activeModules: signal<string[]>(['PATIENT', 'DOCTOR']).asReadonly(),
      coreModules: signal<string[]>(['SETTINGS']).asReadonly(),
      enabledFeatures: signal<string[]>(['online_payment']).asReadonly(),
      resourceUsage: signal([{ resourceCode: 'DOCTOR', resourceName: 'Doctors', limit: 5, currentUsage: 2, isUnlimited: false }]).asReadonly(),
      isTrial: signal(false).asReadonly(),
      currentLicense: signal(null).asReadonly(),
      loadLicense: vi.fn().mockReturnValue(of({ tenantId: 't1', planName: 'Clinic', planCode: 'CLINIC', status: 'ACTIVE', effectiveProducts: [], effectiveModules: [], effectiveConstraints: [], effectiveFeatures: [], purchasedAddons: [], trialEndsAt: null, subscriptionEndsAt: '2027-01-01' })),
      isModuleAccessible: vi.fn().mockReturnValue(true),
      isFeatureEnabled: vi.fn().mockReturnValue(false),
      canCreateResource: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        LicenseStore,
        { provide: EffectiveLicenseService, useValue: mockLicenseService },
      ],
    });

    store = TestBed.runInInjectionContext(() => new LicenseStore());
  });

  it('should have initial state', () => {
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should delegate activeModules to service', () => {
    expect(store.activeModules()).toEqual(['PATIENT', 'DOCTOR']);
  });

  it('should delegate coreModules to service', () => {
    expect(store.coreModules()).toEqual(['SETTINGS']);
  });

  it('should delegate enabledFeatures to service', () => {
    expect(store.enabledFeatures()).toEqual(['online_payment']);
  });

  it('should delegate resourceUsage to service', () => {
    expect(store.resourceUsage()).toHaveLength(1);
  });

  it('should delegate isTrial to service', () => {
    expect(store.isTrial()).toBe(false);
  });

  it('should delegate currentLicense to service', () => {
    expect(store.currentLicense()).toBeNull();
  });

  it('should load license successfully', () => {
    store.loadLicense();
    expect(store.isLoading()).toBe(false);
    expect(mockLicenseService.loadLicense).toHaveBeenCalledOnce();
  });

  it('should handle load license error', () => {
    mockLicenseService.loadLicense = vi.fn().mockReturnValue(of({}));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LicenseStore,
        { provide: EffectiveLicenseService, useValue: mockLicenseService },
      ],
    });
    store = TestBed.runInInjectionContext(() => new LicenseStore());

    store.loadLicense();

    expect(store.isLoading()).toBe(false);
  });

  it('should delegate isModuleAccessible', () => {
    const result = store.isModuleAccessible('PATIENT');
    expect(result).toBe(true);
    expect(mockLicenseService.isModuleAccessible).toHaveBeenCalledWith('PATIENT');
  });

  it('should delegate isFeatureEnabled', () => {
    store.isFeatureEnabled('some_feature');
    expect(mockLicenseService.isFeatureEnabled).toHaveBeenCalledWith('some_feature');
  });

  it('should delegate canCreateResource', () => {
    store.canCreateResource('PATIENT');
    expect(mockLicenseService.canCreateResource).toHaveBeenCalledWith('PATIENT');
  });
});
