import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlatformTenantService } from './platform-tenant.service';
import { PlatformTenant, PlatformModule } from '../models/platform.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('PlatformTenantService', () => {
  let service: PlatformTenantService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/platform/tenants`;

  const mockTenant: PlatformTenant = {
    id: 't1', name: 'Test Clinic', code: 'test', email: 'clinic@test.com',
    phone: '9999999999', status: 'ACTIVE', patientIdPrefix: 'TST',
    timezone: 'Asia/Kolkata', createdAt: '2026-01-01T00:00:00Z',
  };

  const mockModule: PlatformModule = {
    id: 'm1', productId: 'p1', name: 'Patient', code: 'PATIENT',
    description: 'Patient management', isCore: true, displayOrder: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlatformTenantService],
    });
    service = TestBed.inject(PlatformTenantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('list', () => {
    it('should GET all tenants', () => {
      const apiResp: ApiResponse<PlatformTenant[]> = { success: true, data: [mockTenant], message: '', timestamp: '', requestId: '' };

      service.list().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('getById', () => {
    it('should GET tenant by id', () => {
      const apiResp: ApiResponse<PlatformTenant> = { success: true, data: mockTenant, message: '', timestamp: '', requestId: '' };

      service.getById('t1').subscribe((res) => {
        expect(res.data?.name).toBe('Test Clinic');
      });

      const req = httpMock.expectOne(`${baseUrl}/t1`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('create', () => {
    it('should POST new tenant', () => {
      const newTenant = { name: 'New Clinic', code: 'new', email: 'new@test.com' };
      const apiResp: ApiResponse<PlatformTenant> = { success: true, data: { ...mockTenant, name: 'New Clinic' }, message: '', timestamp: '', requestId: '' };

      service.create(newTenant).subscribe((res) => {
        expect(res.data?.name).toBe('New Clinic');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTenant);
      req.flush(apiResp);
    });
  });

  describe('update', () => {
    it('should PUT tenant', () => {
      const update = { name: 'Updated Clinic' };
      const apiResp: ApiResponse<PlatformTenant> = { success: true, data: { ...mockTenant, name: 'Updated Clinic' }, message: '', timestamp: '', requestId: '' };

      service.update('t1', update).subscribe((res) => {
        expect(res.data?.name).toBe('Updated Clinic');
      });

      const req = httpMock.expectOne(`${baseUrl}/t1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush(apiResp);
    });
  });

  describe('updateStatus', () => {
    it('should PUT status', () => {
      const apiResp: ApiResponse<PlatformTenant> = { success: true, data: { ...mockTenant, status: 'SUSPENDED' }, message: '', timestamp: '', requestId: '' };

      service.updateStatus('t1', 'SUSPENDED').subscribe((res) => {
        expect(res.data?.status).toBe('SUSPENDED');
      });

      const req = httpMock.expectOne(`${baseUrl}/t1/status`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'SUSPENDED' });
      req.flush(apiResp);
    });
  });

  describe('getSubscription', () => {
    it('should GET subscription', () => {
      const sub = { planName: 'Clinic', status: 'ACTIVE', endDate: '2027-01-01' };
      const apiResp: ApiResponse<typeof sub> = { success: true, data: sub, message: '', timestamp: '', requestId: '' };

      service.getSubscription('t1').subscribe((res) => {
        expect(res.data?.planName).toBe('Clinic');
      });

      const req = httpMock.expectOne(`${baseUrl}/t1/subscription`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('assignPlan', () => {
    it('should PUT assign plan', () => {
      const apiResp: ApiResponse<void> = { success: true, data: undefined, message: '', timestamp: '', requestId: '' };

      service.assignPlan('t1', 'plan1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/t1/subscription`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ planId: 'plan1' });
      req.flush(apiResp);
    });
  });

  describe('updateModuleStatus', () => {
    it('should PUT module status', () => {
      const apiResp: ApiResponse<void> = { success: true, data: undefined, message: '', timestamp: '', requestId: '' };

      service.updateModuleStatus('t1', 'm1', 'DISABLED').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/t1/modules/m1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ status: 'DISABLED' });
      req.flush(apiResp);
    });
  });

  describe('listModules', () => {
    it('should GET tenant modules', () => {
      const apiResp: ApiResponse<PlatformModule[]> = { success: true, data: [mockModule], message: '', timestamp: '', requestId: '' };

      service.listModules('t1').subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/t1/modules`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });
});
