import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HealthPackageService } from './health-package.service';
import { HealthPackageResponse, HealthPackageBookingResponse, CreateHealthPackageRequest, UpdateHealthPackageRequest, BookHealthPackageRequest } from '../models/health-package.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('HealthPackageService', () => {
  let service: HealthPackageService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/health-packages`;

  const mockPackage: HealthPackageResponse = {
    id: 'hp1', packageName: 'Basic Checkup', description: 'Basic health check',
    actualPriceInPaisa: 200000, offerPriceInPaisa: 150000, testsIncluded: 'Blood, Urine',
    isActive: true, createdAt: '2026-01-01T00:00:00Z',
  };

  const mockBooking: HealthPackageBookingResponse = {
    id: 'b1', packageId: 'hp1', packageName: 'Basic Checkup', patientName: 'John',
    email: 'john@test.com', phone: '9999999999', bookingDate: '2026-01-01',
    status: 'PENDING', createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HealthPackageService],
    });
    service = TestBed.inject(HealthPackageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('list', () => {
    it('should GET with pagination params', () => {
      const paged: PagedResponse<HealthPackageResponse> = { content: [mockPackage], pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, last: true };
      const apiResp: ApiResponse<PagedResponse<HealthPackageResponse>> = { success: true, data: paged, message: '', timestamp: '', requestId: '' };

      service.list(0, 10).subscribe((res) => {
        expect(res.data?.content.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });

    it('should GET without params when none provided', () => {
      const paged: PagedResponse<HealthPackageResponse> = { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0, last: true };
      const apiResp: ApiResponse<PagedResponse<HealthPackageResponse>> = { success: true, data: paged, message: '', timestamp: '', requestId: '' };

      service.list().subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('create', () => {
    it('should POST a new package', () => {
      const request: CreateHealthPackageRequest = { packageName: 'New Package', actualPriceInPaisa: 300000, offerPriceInPaisa: 250000 };
      const apiResp: ApiResponse<HealthPackageResponse> = { success: true, data: mockPackage, message: '', timestamp: '', requestId: '' };

      service.create(request).subscribe((res) => {
        expect(res.data?.packageName).toBe('Basic Checkup');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('update', () => {
    it('should PUT updated package', () => {
      const request: UpdateHealthPackageRequest = { packageName: 'Updated Package' };
      const apiResp: ApiResponse<HealthPackageResponse> = { success: true, data: { ...mockPackage, packageName: 'Updated Package' }, message: '', timestamp: '', requestId: '' };

      service.update('hp1', request).subscribe((res) => {
        expect(res.data?.packageName).toBe('Updated Package');
      });

      const req = httpMock.expectOne(`${baseUrl}/hp1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('toggleActive', () => {
    it('should PUT toggle', () => {
      const apiResp: ApiResponse<HealthPackageResponse> = { success: true, data: mockPackage, message: '', timestamp: '', requestId: '' };

      service.toggleActive('hp1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/hp1/toggle`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp);
    });
  });

  describe('book', () => {
    it('should POST booking', () => {
      const request: BookHealthPackageRequest = { patientName: 'John', email: 'john@test.com', phone: '9999999999', bookingDate: '2026-01-01' };
      const apiResp: ApiResponse<HealthPackageBookingResponse> = { success: true, data: mockBooking, message: '', timestamp: '', requestId: '' };

      service.book('hp1', request).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/hp1/book`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('listBookings', () => {
    it('should GET bookings', () => {
      const apiResp: ApiResponse<HealthPackageBookingResponse[]> = { success: true, data: [mockBooking], message: '', timestamp: '', requestId: '' };

      service.listBookings().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/bookings`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('approveBooking', () => {
    it('should PUT approve', () => {
      const apiResp: ApiResponse<HealthPackageBookingResponse> = { success: true, data: { ...mockBooking, status: 'APPROVED' }, message: '', timestamp: '', requestId: '' };

      service.approveBooking('b1').subscribe((res) => {
        expect(res.data?.status).toBe('APPROVED');
      });

      const req = httpMock.expectOne(`${baseUrl}/bookings/b1/approve`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp);
    });
  });

  describe('rejectBooking', () => {
    it('should PUT reject', () => {
      const apiResp: ApiResponse<void> = { success: true, data: undefined, message: '', timestamp: '', requestId: '' };

      service.rejectBooking('b1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/bookings/b1/reject`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp);
    });
  });
});
