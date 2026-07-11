import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PatientService } from './patient.service';
import { Patient, PatientVisit } from '../models/patient.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('PatientService', () => {
  let service: PatientService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/hms/patients`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PatientService],
    });
    service = TestBed.inject(PatientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPatients', () => {
    it('should GET with default pagination', () => {
      const mockResponse: ApiResponse<PagedResponse<Patient>> = {
        success: true,
        data: { content: [], pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getPatients().subscribe((res) => {
        expect(res.data.pageNumber).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include search param when provided', () => {
      service.getPatients(1, 20, 'john').subscribe();

      const req = httpMock.expectOne(`${apiUrl}?page=1&size=20&search=john`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });

    it('should handle error', () => {
      service.getPatients().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=10`);
      req.flush({ success: false }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getPatientById', () => {
    it('should GET by id', () => {
      const mockResponse: ApiResponse<Patient> = {
        success: true,
        data: { id: 'p1', patientId: 'P001', fullName: 'John', dateOfBirth: '', age: 30, gender: 'MALE', phone: '' },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getPatientById('p1').subscribe((res) => {
        expect(res.data.id).toBe('p1');
      });

      const req = httpMock.expectOne(`${apiUrl}/p1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createPatient', () => {
    it('should POST to create', () => {
      const newPatient: Partial<Patient> = { fullName: 'Jane', phone: '1234567890' };
      const mockResponse: ApiResponse<Patient> = {
        success: true,
        data: { id: 'p2', patientId: 'P002', fullName: 'Jane', dateOfBirth: '', age: 25, gender: 'FEMALE', phone: '1234567890' },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.createPatient(newPatient).subscribe((res) => {
        expect(res.data.fullName).toBe('Jane');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPatient);
      req.flush(mockResponse);
    });
  });

  describe('updatePatient', () => {
    it('should PUT to update', () => {
      const update: Partial<Patient> = { fullName: 'Jane Updated' };

      service.updatePatient('p2', update).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/p2`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getPatientVisits', () => {
    it('should GET visits by patient id', () => {
      const mockResponse: ApiResponse<PatientVisit[]> = {
        success: true,
        data: [{ id: 'v1', date: '2024-01-01', doctorName: 'Dr. A', diagnosis: 'Fever' }],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getPatientVisits('p1').subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].doctorName).toBe('Dr. A');
      });

      const req = httpMock.expectOne(`${apiUrl}/p1/visits`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('searchPatients', () => {
    it('should GET search with q param', () => {
      const mockResponse: ApiResponse<Patient[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.searchPatients('john').subscribe((res) => {
        expect(res.data).toEqual([]);
      });

      const req = httpMock.expectOne(
        (r) => r.url === `${apiUrl}/search` && r.params.get('q') === 'john',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('uploadPatients', () => {
    it('should POST FormData to upload', () => {
      const file = new File(['csv content'], 'patients.csv', { type: 'text/csv' });

      service.uploadPatients(file).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeInstanceOf(FormData);
      req.flush({ success: true, data: { imported: 5, errors: [] } } as unknown as ApiResponse<unknown>);
    });
  });

  describe('deletePatient', () => {
    it('should DELETE patient by id', () => {
      service.deletePatient('p1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/p1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: undefined } as unknown as ApiResponse<unknown>);
    });
  });
});
