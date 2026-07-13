import { TestBed } from '@angular/core/testing';
import { AppointmentCalendar } from './appointment-calendar';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { DoctorService } from '../../../../core/services/doctor.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { Doctor } from '../../../../core/models/doctor.model';
import { Appointment } from '../../../../core/models/appointment.model';

describe('AppointmentCalendar', () => {
  const mockDoctor: Doctor = { id: 'd1', fullName: 'Dr. A', specialization: 'Cardio', qualification: 'MD', consultationFeeInPaisa: 500, isActive: true };
  const mockAppt: Appointment = { id: 'a1', patient: { id: 'p1', fullName: 'Rahul' }, doctor: { id: 'd1', fullName: 'Dr. A' }, appointmentDate: '2026-07-03', appointmentTime: '09:00 AM', tokenNumber: 1, status: 'APPROVED' };

  const mockDocResponse: ApiResponse<Doctor[]> = { success: true, data: [mockDoctor], message: 'ok', timestamp: '', requestId: 'r1' };
  const mockApptResponse: ApiResponse<PagedResponse<Appointment>> = { success: true, data: { content: [mockAppt], pageNumber: 0, pageSize: 50, totalElements: 1, totalPages: 1, last: true }, message: 'ok', timestamp: '', requestId: 'r1' };

  function createComponent(overrides?: Partial<{ appointmentService: Partial<AppointmentService>; doctorService: Partial<DoctorService> }>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: DoctorService, useValue: { getDoctors: vi.fn().mockReturnValue(of(mockDocResponse)), ...(overrides?.doctorService || {}) } },
        { provide: AppointmentService, useValue: { getAppointments: vi.fn().mockReturnValue(of(mockApptResponse)), ...(overrides?.appointmentService || {}) } },
      ],
    });
    return TestBed.runInInjectionContext(() => new AppointmentCalendar());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.doctors).toEqual([]);
    expect(component.appointments).toEqual([]);
    expect(component.isLoading).toBe(true);
    expect(component.timeBlocks.length).toBe(5);
  });

  it('should load data on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.doctors).toEqual([mockDoctor]);
    expect(component.appointments).toEqual([mockAppt]);
    expect(component.isLoading).toBe(false);
  });

  // No error-handling test: component lacks error handlers in nested subscriptions

  it('should filter appointments for a doctor', () => {
    const component = createComponent();
    component.appointments = [mockAppt, { ...mockAppt, id: 'a2', doctor: { id: 'd2', fullName: 'Dr. B' } }];
    const result = component.getAppointmentsForDoctor('d1');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('a1');
  });

  it('should calculate top position from time string', () => {
    const component = createComponent();
    expect(component.getTopPosition('09:00 AM')).toBe(0);
    expect(component.getTopPosition('10:00 AM')).toBe(64);
    expect(component.getTopPosition('12:00 PM')).toBe(192);
    expect(component.getTopPosition('01:00 PM')).toBe(256);
    expect(component.getTopPosition('09:30 AM')).toBe(32);
    expect(component.getTopPosition('')).toBe(0);
    expect(component.getTopPosition('invalid')).toBe(0);
  });
});
