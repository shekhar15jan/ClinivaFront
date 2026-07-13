import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlatformAdminService } from './platform-admin.service';
import { PlatformUser, Product, PlatformModule, SubscriptionPlan, SupportTicket, PlatformReport } from '../models/platform.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('PlatformAdminService', () => {
  let service: PlatformAdminService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  const mockUser: PlatformUser = { id: 'u1', email: 'staff@test.com', isActive: true, role: 'STAFF_ADMIN', createdAt: '2026-01-01T00:00:00Z' };
  const mockProduct: Product = { id: 'p1', name: 'Cliniva HMS', code: 'CLINIVA', description: 'HMS', isActive: true };
  const mockModule: PlatformModule = { id: 'm1', productId: 'p1', name: 'Patient', code: 'PATIENT', description: 'Patient management', isCore: true, displayOrder: 1 };
  const mockPlan: SubscriptionPlan = { id: 'sp1', productId: 'p1', name: 'Clinic', code: 'CLINIC', description: 'Basic', priceInPaisa: 299900, billingCycle: 'MONTHLY', maxDoctors: 5, maxPatients: 500, isActive: true };
  const mockTicket: SupportTicket = { id: 'st1', tenantId: 't1', subject: 'Issue', description: 'Help needed', status: 'OPEN', priority: 'HIGH', createdAt: '2026-01-01T00:00:00Z' };
  const mockReport: PlatformReport = { totalTenants: 10, activeTenants: 8, totalRevenueInPaisa: 5000000, monthlyBreakdown: [{ month: '2026-01', billed: 500000, collected: 400000 }] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlatformAdminService],
    });
    service = TestBed.inject(PlatformAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('createUser', () => {
    it('should POST create platform user', () => {
      const data = { email: 'staff@test.com', password: 'pass123', role: 'STAFF_ADMIN' };
      const apiResp: ApiResponse<PlatformUser> = { success: true, data: mockUser, message: '', timestamp: '', requestId: '' };

      service.createUser(data).subscribe((res) => {
        expect(res.data?.email).toBe('staff@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(apiResp);
    });
  });

  describe('products', () => {
    it('should GET all products', () => {
      const apiResp: ApiResponse<Product[]> = { success: true, data: [mockProduct], message: '', timestamp: '', requestId: '' };

      service.listProducts().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      httpMock.expectOne(`${apiUrl}/platform/products`).flush(apiResp);
    });

    it('should POST create product', () => {
      const data = { name: 'New Product', code: 'NEW' };
      const apiResp: ApiResponse<Product> = { success: true, data: { ...mockProduct, name: 'New Product' }, message: '', timestamp: '', requestId: '' };

      service.createProduct(data).subscribe((res) => {
        expect(res.data?.name).toBe('New Product');
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/products`);
      expect(req.request.method).toBe('POST');
      req.flush(apiResp);
    });
  });

  describe('modules', () => {
    it('should GET all modules', () => {
      const apiResp: ApiResponse<PlatformModule[]> = { success: true, data: [mockModule], message: '', timestamp: '', requestId: '' };

      service.listModules().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      httpMock.expectOne(`${apiUrl}/platform/modules`).flush(apiResp);
    });

    it('should POST create module', () => {
      const data = { name: 'New Module', code: 'NEW_MOD' };
      const apiResp: ApiResponse<PlatformModule> = { success: true, data: { ...mockModule, name: 'New Module' }, message: '', timestamp: '', requestId: '' };

      service.createModule(data).subscribe((res) => {
        expect(res.data?.name).toBe('New Module');
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/modules`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(apiResp);
    });
  });

  describe('plans', () => {
    it('should GET all plans', () => {
      const apiResp: ApiResponse<SubscriptionPlan[]> = { success: true, data: [mockPlan], message: '', timestamp: '', requestId: '' };

      service.listPlans().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      httpMock.expectOne(`${apiUrl}/platform/plans`).flush(apiResp);
    });

    it('should POST create plan', () => {
      const data = { name: 'New Plan', code: 'NEW_PLAN', priceInPaisa: 100000 };
      const apiResp: ApiResponse<SubscriptionPlan> = { success: true, data: { ...mockPlan, name: 'New Plan' }, message: '', timestamp: '', requestId: '' };

      service.createPlan(data).subscribe((res) => {
        expect(res.data?.name).toBe('New Plan');
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/plans`);
      expect(req.request.method).toBe('POST');
      req.flush(apiResp);
    });

    it('should PUT update plan', () => {
      const data = { priceInPaisa: 399900 };
      const apiResp: ApiResponse<SubscriptionPlan> = { success: true, data: { ...mockPlan, priceInPaisa: 399900 }, message: '', timestamp: '', requestId: '' };

      service.updatePlan('sp1', data).subscribe((res) => {
        expect(res.data?.priceInPaisa).toBe(399900);
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/plans/sp1`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp);
    });
  });

  describe('support tickets', () => {
    it('should GET all tickets', () => {
      const apiResp: ApiResponse<SupportTicket[]> = { success: true, data: [mockTicket], message: '', timestamp: '', requestId: '' };

      service.listTickets().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      httpMock.expectOne(`${apiUrl}/platform/support/tickets`).flush(apiResp);
    });

    it('should POST create ticket', () => {
      const data = { subject: 'New Issue', description: 'Details' };
      const apiResp: ApiResponse<SupportTicket> = { success: true, data: { ...mockTicket, subject: 'New Issue' }, message: '', timestamp: '', requestId: '' };

      service.createTicket(data).subscribe((res) => {
        expect(res.data?.subject).toBe('New Issue');
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/support/tickets`);
      expect(req.request.method).toBe('POST');
      req.flush(apiResp);
    });
  });

  describe('reports', () => {
    it('should GET tenant metrics', () => {
      const apiResp: ApiResponse<PlatformReport> = { success: true, data: mockReport, message: '', timestamp: '', requestId: '' };

      service.getTenantMetrics().subscribe((res) => {
        expect(res.data?.totalTenants).toBe(10);
      });

      httpMock.expectOne(`${apiUrl}/platform/reports/tenants`).flush(apiResp);
    });

    it('should GET revenue report', () => {
      const apiResp: ApiResponse<PlatformReport> = { success: true, data: mockReport, message: '', timestamp: '', requestId: '' };

      service.getRevenueReport().subscribe((res) => {
        expect(res.data?.totalRevenueInPaisa).toBe(5000000);
      });

      httpMock.expectOne(`${apiUrl}/platform/reports/revenue`).flush(apiResp);
    });
  });

  describe('audit logs', () => {
    it('should GET platform audit logs with params', () => {
      const data = { content: [{ id: 'a1' }], totalElements: 1 };
      const apiResp: ApiResponse<typeof data> = { success: true, data, message: '', timestamp: '', requestId: '' };

      service.listPlatformAuditLogs({ page: 0, size: 20 }).subscribe((res) => {
        expect(res.data?.totalElements).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/platform/audit-logs?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });

    it('should GET tenant audit logs', () => {
      const data = { content: [], totalElements: 0 };
      const apiResp: ApiResponse<typeof data> = { success: true, data, message: '', timestamp: '', requestId: '' };

      service.listTenantAuditLogs('t1').subscribe((res) => {
        expect(res.data?.totalElements).toBe(0);
      });

      httpMock.expectOne(`${apiUrl}/platform/audit-logs/tenant/t1`).flush(apiResp);
    });
  });
});
