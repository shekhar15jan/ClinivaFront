import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsultationService } from './consultation.service';
import { Consultation, CreateConsultationRequest, Vitals } from '../models/consultation.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('ConsultationService', () => {
  let service: ConsultationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/consultations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConsultationService],
    });
    service = TestBed.inject(ConsultationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getByAppointment', () => {
    it('should GET by appointment id', () => {
      const mockResponse: ApiResponse<Consultation> = {
        success: true,
        data: { id: 'c1', appointmentId: 'a1', patientId: 'p1', doctorId: 'd1', chiefComplaints: 'Fever', status: 'IN_PROGRESS', createdAt: '' },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getByAppointment('a1').subscribe((res) => {
        expect(res.data.id).toBe('c1');
      });

      const req = httpMock.expectOne(`${baseUrl}/appointment/a1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createConsultation', () => {
    it('should POST a new consultation', () => {
      const request: CreateConsultationRequest = {
        appointmentId: 'a1',
        chiefComplaints: 'Headache',
      };

      service.createConsultation(request).subscribe();

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('updateConsultation', () => {
    it('should PUT to update', () => {
      const update: Partial<Consultation> = { diagnosis: 'Migraine' };

      service.updateConsultation('c1', update).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/c1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getById', () => {
    it('should GET consultation by id', () => {
      service.getById('c1').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/c1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getPatientHistory', () => {
    it('should GET patient history by patientId', () => {
      const mockResponse: ApiResponse<Consultation[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.getPatientHistory('p1').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/patient/p1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('recordVitals', () => {
    it('should PUT vitals for appointment', () => {
      const vitals: Vitals = { bloodPressureSystolic: 120, bloodPressureDiastolic: 80, temperature: 98.6 };

      service.recordVitals('a1', vitals).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/a1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ vitals });
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });

    it('should handle error on recordVitals', () => {
      service.recordVitals('a1', {} as Vitals).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/a1`);
      req.flush({ success: false }, { status: 400, statusText: 'Bad Request' });
    });
  });
});
