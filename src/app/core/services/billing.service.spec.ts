import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillingService } from './billing.service';
import { Bill, CreateBillRequest } from '../models/billing.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('BillingService', () => {
  let service: BillingService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/bills`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BillingService],
    });
    service = TestBed.inject(BillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBills', () => {
    it('should GET with pagination and status', () => {
      const mockResponse: ApiResponse<PagedResponse<Bill>> = {
        success: true,
        data: { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getBills(0, 10, 'UNPAID').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('page') === '0' && r.params.get('size') === '10' && r.params.get('status') === 'UNPAID');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call without optional params', () => {
      service.getBills().subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.keys().length === 0);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getBillById', () => {
    it('should GET by id', () => {
      service.getBillById('b1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/b1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('createBill', () => {
    it('should POST to create bill', () => {
      const request: CreateBillRequest = {
        prescriptionId: 'rx1',
        discountInPaisa: 0,
      };

      service.createBill('rx1', request).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/generate?prescriptionId=rx1`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('downloadPdf', () => {
    it('should GET PDF as blob', () => {
      const blob = new Blob(['pdf'], { type: 'application/pdf' });

      service.downloadPdf('b1').subscribe((result) => {
        expect(result).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`${baseUrl}/b1/invoice`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });
  });

  describe('getPatientBills', () => {
    it('should GET patient bills with patientId param', () => {
      const mockResponse: ApiResponse<Bill[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.getPatientBills('p1').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/patient/logged-in` && r.params.get('patientId') === 'p1',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateBill', () => {
    it('should PUT bill update', () => {
      service.updateBill('b1', { discountInPaisa: 0 }).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/b1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ discountInPaisa: 0 });
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });
});
