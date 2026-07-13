import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TenantService } from './tenant.service';
import { ApiResponse } from '../models/common.model';
import { TenantResolution, TenantModule, Subscription, OnboardingStatus } from '../models/tenant.model';
import { environment } from '../../../environments/environment';

describe('TenantService', () => {
  let service: TenantService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TenantService],
    });
    service = TestBed.inject(TenantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('resolveByCode', () => {
    it('should GET tenant/resolve with code param', () => {
      const mockResponse: ApiResponse<TenantResolution> = {
        success: true,
        data: {} as TenantResolution,
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.resolveByCode('CLIN01').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/resolve?code=CLIN01`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error', () => {
      service.resolveByCode('INVALID').subscribe({
        error: (err) => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/resolve?code=INVALID`);
      req.flush({ success: false, message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('resolveByEmail', () => {
    it('should GET tenant/resolve-by-email with email param', () => {
      const mockResponse: ApiResponse<TenantResolution[]> = {
        success: true,
        data: [],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.resolveByEmail('test@cliniva.com').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/resolve-by-email?email=test@cliniva.com`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTenantModules', () => {
    it('should GET tenant/{id}/modules', () => {
      const mockResponse: ApiResponse<TenantModule[]> = {
        success: true,
        data: [],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getTenantModules('t1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/t1/modules`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSubscription', () => {
    it('should GET tenant/{id}/subscription', () => {
      const mockResponse: ApiResponse<Subscription> = {
        success: true,
        data: {} as Subscription,
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getSubscription('t1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/t1/subscription`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getOnboardingStatus', () => {
    it('should GET tenant/onboarding', () => {
      const mockResponse: ApiResponse<OnboardingStatus> = {
        success: true,
        data: { step: 'CLINIC', completed: false },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getOnboardingStatus().subscribe((res) => {
        expect(res.data.completed).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/onboarding`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('completeOnboardingStep', () => {
    it('should POST to tenant/onboarding?step=', () => {
      const mockResponse: ApiResponse<OnboardingStatus> = {
        success: true,
        data: {} as OnboardingStatus,
        message: '',
        timestamp: '',
        requestId: '',
      };
      const data = { clinicName: 'Test Clinic' };

      service.completeOnboardingStep('clinic', data).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/tenant/onboarding?step=clinic`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(data);
      req.flush(mockResponse);
    });
  });
});
