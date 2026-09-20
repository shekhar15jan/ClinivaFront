import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DoctorService } from './doctor.service';
import { Doctor, DoctorWithSlotsResponse, AvailabilityDto, UpdateAvailabilityRequest } from '../models/doctor.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/hms/doctors`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DoctorService],
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDoctors', () => {
    it('should GET all doctors', () => {
      const mockResponse: ApiResponse<PagedResponse<Doctor>> = {
        success: true,
        data: { content: [{ id: 'd1', fullName: 'Dr. A', specialization: 'Cardiology', qualification: 'MD', consultationFeeInPaisa: 50000, isActive: true }], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1, last: true },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getDoctors().subscribe((res) => {
        expect(res.data.content.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDoctorsWithSlots', () => {
    it('should GET with-slots with date param', () => {
      const mockResponse: ApiResponse<DoctorWithSlotsResponse[]> = { success: true, data: [], message: '', timestamp: '', requestId: '' };

      service.getDoctorsWithSlots('2024-06-15').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/with-slots?date=2024-06-15`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDoctorById', () => {
    it('should GET doctor by id', () => {
      service.getDoctorById('d1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/d1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('createDoctor', () => {
    it('should POST a new doctor', () => {
      const doctor: Partial<Doctor> = { fullName: 'Dr. B', specialization: 'Neurology', qualification: 'DM', consultationFeeInPaisa: 80000, isActive: true };

      service.createDoctor(doctor).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(doctor);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('updateDoctor', () => {
    it('should PUT to update doctor', () => {
      const update: Partial<Doctor> = { consultationFeeInPaisa: 60000 };

      service.updateDoctor('d1', update).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/d1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('deleteDoctor', () => {
    it('should DELETE doctor', () => {
      service.deleteDoctor('d1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/d1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: undefined } as unknown as ApiResponse<unknown>);
    });

    it('should handle error on delete', () => {
      service.deleteDoctor('d1').subscribe({
        error: (err) => {
          expect(err.status).toBe(409);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/d1`);
      req.flush({ success: false, message: 'Cannot delete' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('getAvailability', () => {
    it('should GET availability for doctor', () => {
      const mockResponse: ApiResponse<AvailabilityDto[]> = {
        success: true,
        data: [{ dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '17:00:00' }],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getAvailability('d1').subscribe((res) => {
        expect(res.data[0].dayOfWeek).toBe('MONDAY');
      });

      const req = httpMock.expectOne(`${apiUrl}/d1/availability`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('setAvailability', () => {
    it('should PUT availability for doctor', () => {
      // The backend reads { availability: [...] }. This used to send { slots: [...] }, which it ignored,
      // so no doctor's hours were ever saved.
      const availability: UpdateAvailabilityRequest = {
        availability: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' }],
      };

      service.setAvailability('d1', availability).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/d1/availability`);
      expect(req.request.method).toBe('PUT');
      expect(Object.keys(req.request.body)).toEqual(['availability']);
      expect(req.request.body).toEqual(availability);
      req.flush({ success: true, data: [] } as unknown as ApiResponse<unknown>);
    });
  });
});
