import { TestBed } from '@angular/core/testing';
import { TenantContextService } from './tenant-context.service';
import { EffectiveLicenseService } from './effective-license.service';
import { Tenant, TenantModule, Subscription } from '../models/tenant.model';
import { vi } from 'vitest';

describe('TenantContextService', () => {
  let service: TenantContextService;
  let mockLicenseService: { setLicenseFromTenantContext: ReturnType<typeof vi.fn>; isModuleAccessible: ReturnType<typeof vi.fn>; getResourceUsage: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };

  const mockTenant: Tenant = {
    id: 't1',
    tenantId: 'CLIN01',
    name: 'Test Clinic',
    displayName: 'Test Clinic',
    contactEmail: 'admin@test.com',
    contactPhone: '1234567890',
    address: '123 Main St',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    patientIdPrefix: 'P',
  };

  const mockModules: TenantModule[] = [
    { id: 'm1', moduleId: 'mod1', moduleCode: 'CORE_HMS', moduleName: 'Core HMS', status: 'ACTIVE', source: 'PLAN', isCore: true },
    { id: 'm2', moduleId: 'mod2', moduleCode: 'PHARMACY', moduleName: 'Pharmacy', status: 'ACTIVE', source: 'ADDON', isCore: false },
  ];

  const mockSubscription: Subscription = {
    id: 's1',
    tenantId: 't1',
    productId: 'prod1',
    planId: 'plan1',
    planName: 'Professional',
    status: 'ACTIVE',
    startDate: '2024-01-01',
    endDate: '2025-12-31',
    maxDoctors: 10,
    maxPatients: 500,
  };

  beforeEach(() => {
    mockLicenseService = {
      setLicenseFromTenantContext: vi.fn(),
      isModuleAccessible: vi.fn(),
      getResourceUsage: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TenantContextService,
        { provide: EffectiveLicenseService, useValue: mockLicenseService },
      ],
    });
    service = TestBed.inject(TenantContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have null/empty initial signals', () => {
      expect(service.tenant()).toBeNull();
      expect(service.modules()).toEqual([]);
      expect(service.subscription()).toBeNull();
      expect(service.tenantCode()).toBeNull();
      expect(service.tenantName()).toBe('Cliniva HMS');
      expect(service.isTrial()).toBe(false);
      expect(service.isActive()).toBe(false);
      expect(service.activeModuleCodes()).toEqual([]);
    });
  });

  describe('setTenantContext', () => {
    it('should set tenant, modules, subscription and propagate to license service', () => {
      service.setTenantContext(mockTenant, mockModules, mockSubscription);

      expect(service.tenant()).toEqual(mockTenant);
      expect(service.modules()).toEqual(mockModules);
      expect(service.subscription()).toEqual(mockSubscription);
      expect(service.tenantCode()).toBe('CLIN01');
      expect(service.tenantName()).toBe('Test Clinic');
      expect(service.isActive()).toBe(true);
      expect(service.activeModuleCodes()).toEqual(['CORE_HMS', 'PHARMACY']);

      expect(mockLicenseService.setLicenseFromTenantContext).toHaveBeenCalledWith(
        mockModules.map((m) => ({
          moduleCode: m.moduleCode,
          moduleName: m.moduleName,
          status: m.status,
          isCore: m.isCore,
          source: m.source,
        })),
        {
          planName: 'Professional',
          status: 'ACTIVE',
          endDate: '2025-12-31',
          maxDoctors: 10,
          maxPatients: 500,
        },
      );
    });

    it('should set isTrial to true when tenant status is TRIAL', () => {
      service.setTenantContext({ ...mockTenant, status: 'TRIAL' }, mockModules, mockSubscription);
      expect(service.isTrial()).toBe(true);
      expect(service.isActive()).toBe(true);
    });

    it('should set isActive to false for SUSPENDED status', () => {
      service.setTenantContext({ ...mockTenant, status: 'SUSPENDED' }, mockModules, mockSubscription);
      expect(service.isActive()).toBe(false);
    });
  });

  describe('hasModule', () => {
    it('should delegate to license service', () => {
      mockLicenseService.isModuleAccessible.mockReturnValue(true);
      expect(service.hasModule('CORE_HMS')).toBe(true);
      expect(mockLicenseService.isModuleAccessible).toHaveBeenCalledWith('CORE_HMS');
    });
  });

  describe('isModuleActive', () => {
    it('should delegate to license service', () => {
      mockLicenseService.isModuleAccessible.mockReturnValue(false);
      expect(service.isModuleActive('PHARMACY')).toBe(false);
    });
  });

  describe('getModuleStatus', () => {
    it('should return module by code', () => {
      service.setTenantContext(mockTenant, mockModules, mockSubscription);

      const mod = service.getModuleStatus('CORE_HMS');
      expect(mod?.moduleName).toBe('Core HMS');
    });

    it('should return undefined for unknown module', () => {
      expect(service.getModuleStatus('UNKNOWN')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should reset signals and call license service clear', () => {
      service.setTenantContext(mockTenant, mockModules, mockSubscription);
      expect(service.tenant()).toBeTruthy();

      service.clear();

      expect(service.tenant()).toBeNull();
      expect(service.modules()).toEqual([]);
      expect(service.subscription()).toBeNull();
      expect(mockLicenseService.clear).toHaveBeenCalled();
    });
  });

  describe('getMaxDoctors', () => {
    it('should return limit from license service when available', () => {
      mockLicenseService.getResourceUsage.mockReturnValue({ current: 2, limit: 10, isUnlimited: false });
      expect(service.getMaxDoctors()).toBe(10);
      expect(mockLicenseService.getResourceUsage).toHaveBeenCalledWith('DOCTOR');
    });

    it('should fall back to subscription maxDoctors', () => {
      mockLicenseService.getResourceUsage.mockReturnValue(null);
      service.setTenantContext(mockTenant, mockModules, mockSubscription);
      expect(service.getMaxDoctors()).toBe(10);
    });

    it('should return default of 1 when nothing available', () => {
      mockLicenseService.getResourceUsage.mockReturnValue(null);
      expect(service.getMaxDoctors()).toBe(1);
    });
  });

  describe('getMaxPatients', () => {
    it('should return limit from license service when available', () => {
      mockLicenseService.getResourceUsage.mockReturnValue({ current: 50, limit: 500, isUnlimited: false });
      expect(service.getMaxPatients()).toBe(500);
    });

    it('should fall back to default of 100', () => {
      mockLicenseService.getResourceUsage.mockReturnValue(null);
      expect(service.getMaxPatients()).toBe(100);
    });
  });
});
