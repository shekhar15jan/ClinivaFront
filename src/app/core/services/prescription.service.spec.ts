import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PrescriptionService } from './prescription.service';
import { Prescription, CreatePrescriptionRequest, UpdatePrescriptionRequest } from '../models/prescription.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/prescriptions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrescriptionService],
    });
    service = TestBed.inject(PrescriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPrescriptions', () => {
    it('should GET with pagination params', () => {
      const mockResponse: ApiResponse<PagedResponse<Prescription>> = {
        success: true,
        data: { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getPrescriptions(0, 10).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.get('page') === '0' && r.params.get('size') === '10');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call without optional params', () => {
      service.getPrescriptions().subscribe();

      const req = httpMock.expectOne((r) => r.url === baseUrl && r.params.keys().length === 0);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getPrescriptionById', () => {
    it('should GET by id', () => {
      service.getPrescriptionById('rx1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rx1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getPrescriptionsByPatient', () => {
    it('should GET prescriptions by patient', () => {
      const mockResponse: ApiResponse<Prescription[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.getPrescriptionsByPatient('p1').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/patient/p1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createPrescription', () => {
    it('should POST a new prescription', () => {
      const request: CreatePrescriptionRequest = {
        consultationId: 'c1',
        medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'BD', duration: '5 days' }],
      };

      service.createPrescription(request).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getDoctorPrescriptions', () => {
    it('should GET doctor prescriptions with doctorId param', () => {
      const mockResponse: ApiResponse<Prescription[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.getDoctorPrescriptions('d1').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/doctor/logged-in` && r.params.get('doctorId') === 'd1',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getPatientPrescriptions', () => {
    it('should GET patient prescriptions with patientId param', () => {
      const mockResponse: ApiResponse<Prescription[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.getPatientPrescriptions('p1').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${baseUrl}/patient/logged-in` && r.params.get('patientId') === 'p1',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getByAppointment', () => {
    it('should GET prescription by appointment id', () => {
      service.getByAppointment('a1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/appointment/a1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('updatePrescription', () => {
    it('should PUT to update prescription', () => {
      const request: UpdatePrescriptionRequest = {
        medicines: [{ medicineName: 'Aspirin', dosage: '100mg', frequency: 'OD', duration: '3 days' }],
      };

      service.updatePrescription('rx1', request).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rx1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('deletePrescription', () => {
    it('should DELETE prescription by id', () => {
      service.deletePrescription('rx1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/rx1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: undefined } as unknown as ApiResponse<unknown>);
    });
  });

  describe('downloadPdf', () => {
    it('should GET PDF as blob', () => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' });

      service.downloadPdf('rx1').subscribe((result) => {
        expect(result).toBeInstanceOf(Blob);
      });

      const req = httpMock.expectOne(`${baseUrl}/rx1/pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(blob);
    });
  });
});
