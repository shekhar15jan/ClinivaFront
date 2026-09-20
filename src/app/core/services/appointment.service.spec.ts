import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../models/appointment.model';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/hms/appointments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService],
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAppointments', () => {
    it('should GET with default pagination', () => {
      const mockResponse: ApiResponse<RawPagedResponse<Appointment>> = {
        success: true,
        data: { content: [], pageNumber: 0, size: 50, totalElements: 0, totalPages: 0, last: true },
        message: '',
        timestamp: '',
        requestId: '',
      };

      let captured: ApiResponse<PagedResponse<Appointment>> | undefined;
      service.getAppointments().subscribe((res) => {
        captured = res;
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=50`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(captured?.data.pageSize).toBe(50);
    });

    it('should include status and doctorId filters', () => {
      service.getAppointments(0, 50, 'PENDING', 'd1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=50&status=PENDING&doctorId=d1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('createAppointment', () => {
    it('should POST a new appointment', () => {
      const request: CreateAppointmentRequest = {
        patientId: 'p1',
        doctorId: 'd1',
        appointmentDate: '2024-06-20',
        appointmentTime: '10:00',
        reason: 'Checkup',
      };

      service.createAppointment(request).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getAppointmentById', () => {
    it('should GET appointment by id', () => {
      service.getAppointmentById('a1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/a1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('approveAppointment', () => {
    it('should PUT to approve', () => {
      service.approveAppointment('a1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/a1/approve`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });

    it('should handle error on approve', () => {
      service.approveAppointment('a1').subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/a1/approve`);
      req.flush({ success: false }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('cancelAppointment', () => {
    it('should DELETE appointment', () => {
      service.cancelAppointment('a1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/a1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toBeNull();
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('rejectAppointment', () => {
    it('should PUT to reject', () => {
      service.rejectAppointment('a1').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/a1/reject`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getDoctorAppointments', () => {
    it('should GET the appointments of the signed-in doctor and send no id', () => {
      service.getDoctorAppointments().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${apiUrl}/doctor/logged-in` && r.params.keys().length === 0,
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getPatientAppointments', () => {
    it('should GET the appointments of the signed-in patient and send no id', () => {
      service.getPatientAppointments().subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${apiUrl}/patient/logged-in` && r.params.keys().length === 0,
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] } as unknown as ApiResponse<unknown>);
    });
  });

  describe('getAvailableSlots', () => {
    it('should GET available slots with doctorId and date params', () => {
      service.getAvailableSlots('d1', '2024-06-20').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url === `${apiUrl}/slots`
          && r.params.get('doctorId') === 'd1'
          && r.params.get('date') === '2024-06-20',
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [] } as unknown as ApiResponse<unknown>);
    });
  });

  describe('updateAppointment', () => {
    it('should PUT to update appointment', () => {
      const update: UpdateAppointmentRequest = { status: 'APPROVED' };

      service.updateAppointment('a1', update).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/a1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(update);
      req.flush({ success: true, data: {} } as unknown as ApiResponse<unknown>);
    });
  });
});
