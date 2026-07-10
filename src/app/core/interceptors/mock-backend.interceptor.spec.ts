import { TestBed } from '@angular/core/testing';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { MockBackendInterceptor } from './mock-backend.interceptor';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

vi.mock('../../../environments/environment', () => ({
  environment: { production: false, apiUrl: 'http://localhost:8080/api/v1', enableMock: true }
}));

describe('MockBackendInterceptor', () => {
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
  });

  describe('Auth endpoints', () => {
    it('should respond to send-otp with success', async () => {
      const res = await firstValueFrom(
        http.post<{ success: boolean; message: string }>('/api/v1/hms/auth/send-otp', {
          email: 'test@cliniva.com',
        })
      );
      expect(res.success).toBe(true);
      expect(res.message).toContain('OTP');
    });

    it('should respond to verify-otp with JWT token', async () => {
      const res = await firstValueFrom(
        http.post<{ success: boolean; data: { accessToken: string; user: { email: string } } }>(
          '/api/v1/hms/auth/verify-otp',
          { email: 'test@cliniva.com', otp: '123456' }
        )
      );
      expect(res.success).toBe(true);
      expect(res.data.accessToken).toBe('mock.jwt.token.admin');
      expect(res.data.user.email).toBe('admin@clinivahms.com');
    });
  });

  describe('Patient endpoints', () => {
    it('should return patient list', async () => {
      const res = await firstValueFrom(
        http.get<{ success: boolean; data: { content: { fullName: string }[]; totalElements: number } }>(
          '/api/v1/hms/patients'
        )
      );
      expect(res.success).toBe(true);
      expect(res.data.content.length).toBeGreaterThanOrEqual(1);
      expect(res.data.content[0].fullName).toBe('Rahul Sharma');
    });

    it('should create a new patient', async () => {
      const newPatient = { fullName: 'Test Patient', phone: '9999999999' };
      const res = await firstValueFrom(
        http.post<{ success: boolean; data: { patientId: string } }>('/api/v1/hms/patients', newPatient)
      );
      expect(res.success).toBe(true);
      expect(res.data.patientId).toContain('CLI-');
    });
  });

  describe('Doctor endpoints', () => {
    it('should return doctor list', async () => {
      const res = await firstValueFrom(
        http.get<{ success: boolean; data: unknown[] }>('/api/v1/hms/doctors')
      );
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return doctors with available slots', async () => {
      const res = await firstValueFrom(
        http.get<{ success: boolean; data: { availableSlots: string[] }[] }>(
          '/api/v1/hms/doctors/with-slots'
        )
      );
      expect(res.success).toBe(true);
      expect(res.data[0].availableSlots).toBeDefined();
    });
  });

  describe('Appointment endpoints', () => {
    it('should create an appointment and return PENDING status', async () => {
      const res = await firstValueFrom(
        http.post<{ success: boolean; data: { status: string; tokenNumber: number } }>(
          '/api/v1/hms/appointments',
          { patientId: '1', doctorId: 'd1', appointmentDate: '2026-07-05', appointmentTime: '10:00' }
        )
      );
      expect(res.success).toBe(true);
      expect(res.data.status).toBe('PENDING');
      expect(res.data.tokenNumber).toBeDefined();
    });
  });

  describe('Dashboard/Report endpoints', () => {
    it('should return dashboard stats', async () => {
      const res = await firstValueFrom(
        http.get<{ success: boolean; data: { totalPatients: number; todayAppointments: number } }>(
          '/api/v1/hms/reports/dashboard'
        )
      );
      expect(res.success).toBe(true);
      expect(res.data.totalPatients).toBeDefined();
      expect(res.data.todayAppointments).toBeDefined();
    });

    it('should return appointment trends', async () => {
      const res = await firstValueFrom(
        http.get<{ success: boolean; data: unknown[] }>('/api/v1/hms/reports/appointment-trends')
      );
      expect(res.success).toBe(true);
      expect(res.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Settings endpoints', () => {
    it('should return clinic settings', async () => {
      const res = await firstValueFrom(
        http.get<{ success: boolean; data: { clinicName: string } }>('/api/v1/hms/settings')
      );
      expect(res.success).toBe(true);
      expect(res.data.clinicName).toBe('Cliniva Hospital');
    });

    it('should update clinic settings', async () => {
      const res = await firstValueFrom(
        http.put<{ success: boolean; data: { clinicName: string } }>('/api/v1/hms/settings', {
          clinicName: 'Updated Clinic',
        })
      );
      expect(res.success).toBe(true);
      expect(res.data.clinicName).toBe('Updated Clinic');
    });
  });

  describe('Unhandled endpoints', () => {
    it('should pass through unhandled requests', async () => {
      await expect(
        firstValueFrom(http.get('/api/unknown'))
      ).rejects.toThrow();
    });
  });
});
