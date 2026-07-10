import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SettingService } from './setting.service';
import { ClinicSettings } from '../models/setting.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('SettingService', () => {
  let service: SettingService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/settings`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingService],
    });
    service = TestBed.inject(SettingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get', () => {
    it('should GET settings', () => {
      const mockResponse: ApiResponse<ClinicSettings> = {
        success: true,
        data: {
          clinicName: 'Test Clinic',
          address: '123 Main St',
          phone: '1234567890',
          email: 'clinic@test.com',
          patientIdPrefix: 'P',
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          defaultConsultationFeeInPaisa: 50000,
          enableOnlinePayment: false,
          enableOtpLogin: true,
        },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.get().subscribe((res) => {
        expect(res.data.clinicName).toBe('Test Clinic');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('update', () => {
    it('should PUT updated settings', () => {
      const update: Partial<ClinicSettings> = { clinicName: 'Updated Clinic', defaultConsultationFeeInPaisa: 60000 };

      service.update(update).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });

    it('should handle error on update', () => {
      service.update({ clinicName: '' }).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({ success: false }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
