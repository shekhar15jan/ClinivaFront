import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OnboardingService } from './onboarding.service';
import { OnboardingStatus, ClinicConfig, DepartmentConfig, DoctorConfig, StaffConfig } from '../models/tenant.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/tenant/onboarding`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OnboardingService],
    });
    service = TestBed.inject(OnboardingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStatus', () => {
    it('should GET onboarding status', () => {
      const mockResponse: ApiResponse<OnboardingStatus> = {
        success: true,
        data: { isComplete: false, currentStep: 2, totalSteps: 5, steps: [] },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getStatus().subscribe((res) => {
        expect(res.data.currentStep).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('saveClinicConfig', () => {
    it('should POST clinic config', () => {
      const config: ClinicConfig = {
        clinicName: 'Test Clinic',
        address: '123 Main St',
        phone: '1234567890',
        email: 'clinic@test.com',
        patientIdPrefix: 'P',
        timezone: 'Asia/Kolkata',
        facilities: ['OPD', 'Pharmacy'],
      };

      service.saveClinicConfig(config).subscribe();

      const req = httpMock.expectOne(`${apiUrl}?step=CLINIC`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(config);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('saveDepartments', () => {
    it('should POST departments', () => {
      const departments: DepartmentConfig[] = [{ name: 'Cardiology' }, { name: 'Neurology' }];

      service.saveDepartments(departments).subscribe();

      const req = httpMock.expectOne(`${apiUrl}?step=DEPARTMENTS`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ departments });
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('saveDoctors', () => {
    it('should POST doctors', () => {
      const doctors: DoctorConfig[] = [
        { fullName: 'Dr. A', specialization: 'Cardiology', qualification: 'MD', consultationFeeInPaisa: 50000, phone: '123', email: 'dr.a@test.com' },
      ];

      service.saveDoctors(doctors).subscribe();

      const req = httpMock.expectOne(`${apiUrl}?step=DOCTORS`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ doctors });
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('saveStaff', () => {
    it('should POST staff', () => {
      const staff: StaffConfig[] = [
        { fullName: 'John', email: 'john@test.com', role: 'RECEPTIONIST' },
      ];

      service.saveStaff(staff).subscribe();

      const req = httpMock.expectOne(`${apiUrl}?step=STAFF`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ staff });
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('complete', () => {
    it('should POST to complete onboarding', () => {
      service.complete().subscribe();

      const req = httpMock.expectOne(`${apiUrl}?step=COMPLETE`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });

    it('should handle error', () => {
      service.complete().subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}?step=COMPLETE`);
      req.flush({ success: false }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
