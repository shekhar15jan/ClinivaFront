import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EffectiveLicenseService } from './effective-license.service';
import { EffectiveLicense, EffectiveModule, ResourceConstraint } from '../models/effective-license.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('EffectiveLicenseService', () => {
  let service: EffectiveLicenseService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockModules: EffectiveModule[] = [
    { moduleCode: 'CORE_HMS', moduleName: 'Core HMS', isCore: true, source: 'CORE', status: 'ACTIVE' },
    { moduleCode: 'PHARMACY', moduleName: 'Pharmacy', isCore: false, source: 'ADDON', status: 'ACTIVE' },
    { moduleCode: 'LAB', moduleName: 'Lab', isCore: false, source: 'TRIAL', status: 'TRIAL' },
    { moduleCode: 'EXPIRED_MOD', moduleName: 'Expired', isCore: false, source: 'PLAN', status: 'EXPIRED' },
  ];

  const mockConstraints: ResourceConstraint[] = [
    { resourceCode: 'DOCTOR', resourceName: 'Doctors', limit: 5, currentUsage: 2, isUnlimited: false },
    { resourceCode: 'PATIENT', resourceName: 'Patients', limit: 0, currentUsage: 50, isUnlimited: true },
  ];

  function createMockLicense(overrides?: Partial<EffectiveLicense>): EffectiveLicense {
    return {
      tenantId: 't1',
      planName: 'Professional',
      planCode: 'PRO',
      status: 'ACTIVE',
      effectiveProducts: [],
      effectiveModules: mockModules,
      effectiveConstraints: mockConstraints,
      effectiveFeatures: [
        { featureCode: 'REPORTS', featureName: 'Reports', isEnabled: true, source: 'PLAN' },
        { featureCode: 'ANALYTICS', featureName: 'Analytics', isEnabled: false, source: 'PLAN' },
      ],
      purchasedAddons: [],
      trialEndsAt: null,
      subscriptionEndsAt: '2025-12-31',
      ...overrides,
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EffectiveLicenseService],
    });
    service = TestBed.inject(EffectiveLicenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial computed values', () => {
    it('should return empty arrays when no license loaded', () => {
      expect(service.activeModules()).toEqual([]);
      expect(service.coreModules()).toEqual([]);
      expect(service.enabledFeatures()).toEqual([]);
      expect(service.resourceUsage()).toEqual([]);
      expect(service.isTrial()).toBe(false);
      expect(service.trialEndsAt()).toBeNull();
      expect(service.planName()).toBe('');
      expect(service.subscriptionStatus()).toBeNull();
      expect(service.currentLicense()).toBeNull();
    });
  });

  describe('loadLicense', () => {
    it('should GET effective license and set signals', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };

      service.loadLicense().subscribe((result) => {
        expect(result.planName).toBe('Professional');
        expect(service.activeModules()).toContain('CORE_HMS');
        expect(service.activeModules()).toContain('PHARMACY');
        expect(service.activeModules()).toContain('LAB');
        expect(service.activeModules()).not.toContain('EXPIRED_MOD');
        expect(service.coreModules()).toEqual(['CORE_HMS']);
        expect(service.planName()).toBe('Professional');
        expect(service.subscriptionStatus()).toBe('ACTIVE');
      });

      const req = httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error', () => {
      service.loadLicense().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`);
      req.flush({ success: false }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('refreshUsage', () => {
    it('should GET usage and update constraint in license', () => {
      const license = createMockLicense();
      const initialResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(initialResponse);

      const updatedConstraint: ResourceConstraint = { resourceCode: 'DOCTOR', resourceName: 'Doctors', limit: 5, currentUsage: 3, isUnlimited: false };
      const mockResponse: ApiResponse<ResourceConstraint> = { success: true, data: updatedConstraint, message: '', timestamp: '', requestId: '' };

      service.refreshUsage('DOCTOR').subscribe((result) => {
        expect(result.currentUsage).toBe(3);

        const usage = service.getResourceUsage('DOCTOR');
        expect(usage?.current).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/hms/internal/license/usage/DOCTOR`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should do nothing if no license loaded', () => {
      const updatedConstraint: ResourceConstraint = { resourceCode: 'DOCTOR', resourceName: 'Doctors', limit: 5, currentUsage: 3, isUnlimited: false };
      const mockResponse: ApiResponse<ResourceConstraint> = { success: true, data: updatedConstraint, message: '', timestamp: '', requestId: '' };

      service.refreshUsage('DOCTOR').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/hms/internal/license/usage/DOCTOR`);
      req.flush(mockResponse);

      expect(service.getResourceUsage('DOCTOR')).toBeNull();
    });
  });

  describe('isModuleAccessible', () => {
    it('should return true for core modules', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.isModuleAccessible('CORE_HMS')).toBe(true);
    });

    it('should return true for active or trial modules', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.isModuleAccessible('PHARMACY')).toBe(true);
      expect(service.isModuleAccessible('LAB')).toBe(true);
    });

    it('should return false for expired/disabled modules', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.isModuleAccessible('EXPIRED_MOD')).toBe(false);
    });

    it('should return false for unknown module', () => {
      expect(service.isModuleAccessible('UNKNOWN')).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for enabled features', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.isFeatureEnabled('REPORTS')).toBe(true);
      expect(service.isFeatureEnabled('ANALYTICS')).toBe(false);
    });

    it('should return false when no license loaded', () => {
      expect(service.isFeatureEnabled('REPORTS')).toBe(false);
    });
  });

  describe('canCreateResource', () => {
    it('should return true if constraint not found', () => {
      expect(service.canCreateResource('UNKNOWN')).toBe(true);
    });

    it('should return true if unlimited', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.canCreateResource('PATIENT')).toBe(true);
    });

    it('should return true if under limit', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.canCreateResource('DOCTOR')).toBe(true);
    });

    it('should return false if at limit', () => {
      const constraints: ResourceConstraint[] = [
        { resourceCode: 'DOCTOR', resourceName: 'Doctors', limit: 2, currentUsage: 2, isUnlimited: false },
      ];
      const license = createMockLicense({ effectiveConstraints: constraints });
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.canCreateResource('DOCTOR')).toBe(false);
    });
  });

  describe('getResourceUsage', () => {
    it('should return usage info for known resource', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      const usage = service.getResourceUsage('DOCTOR');
      expect(usage).toEqual({ current: 2, limit: 5, isUnlimited: false });
    });

    it('should return null for unknown resource', () => {
      expect(service.getResourceUsage('UNKNOWN')).toBeNull();
    });
  });

  describe('getModuleInfo', () => {
    it('should return module by code', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      const mod = service.getModuleInfo('CORE_HMS');
      expect(mod?.moduleName).toBe('Core HMS');
    });

    it('should return undefined for unknown module', () => {
      expect(service.getModuleInfo('UNKNOWN')).toBeUndefined();
    });
  });

  describe('setLicenseFromTenantContext', () => {
    it('should set license from modules and subscription data', () => {
      service.setLicenseFromTenantContext(
        [
          { moduleCode: 'CORE_HMS', moduleName: 'Core HMS', status: 'ACTIVE', isCore: true, source: 'CORE' },
          { moduleCode: 'PHARMACY', moduleName: 'Pharmacy', status: 'ACTIVE', isCore: false, source: 'ADDON' },
        ],
        { planName: 'Professional', status: 'ACTIVE', endDate: '2025-12-31', maxDoctors: 10, maxPatients: 500 },
      );

      expect(service.activeModules()).toContain('CORE_HMS');
      expect(service.activeModules()).toContain('PHARMACY');
      expect(service.planName()).toBe('Professional');
      expect(service.subscriptionStatus()).toBe('ACTIVE');

      const docUsage = service.getResourceUsage('DOCTOR');
      expect(docUsage?.limit).toBe(10);

      const patUsage = service.getResourceUsage('PATIENT');
      expect(patUsage?.limit).toBe(500);
    });
  });

  describe('clear', () => {
    it('should reset all signals to initial state', () => {
      const license = createMockLicense();
      const mockResponse: ApiResponse<EffectiveLicense> = { success: true, data: license, message: '', timestamp: '', requestId: '' };
      service.loadLicense().subscribe();
      httpMock.expectOne(`${apiUrl}/hms/internal/license/effective`).flush(mockResponse);

      expect(service.planName()).toBe('Professional');

      service.clear();

      expect(service.activeModules()).toEqual([]);
      expect(service.planName()).toBe('');
      expect(service.currentLicense()).toBeNull();
    });
  });
});
