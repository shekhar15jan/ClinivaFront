import { TestBed } from '@angular/core/testing';
import { BookingFlow } from './booking-flow';
import { DoctorService } from '../../../../core/services/doctor.service';
import { PatientService } from '../../../../core/services/patient.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { DoctorWithSlots } from '../../../../core/models/doctor.model';
import { Patient } from '../../../../core/models/patient.model';

describe('BookingFlow', () => {
  const mockDoc: DoctorWithSlots = { id: 'd1', fullName: 'Dr. A', specialization: 'Cardio', qualification: 'MD', consultationFeeInPaisa: 500, isActive: true, availableSlots: ['09:00', '10:00'] };
  const mockPatient: Patient = { id: 'p1', patientId: 'CLV-001', fullName: 'Rahul', dateOfBirth: '1990-01-01', age: 36, gender: 'MALE', phone: '9876543210' };

  const mockDocResponse: ApiResponse<DoctorWithSlots[]> = { success: true, data: [mockDoc], message: 'ok', timestamp: '', requestId: 'r1' };
  const mockPatientPaged = { success: true, data: { content: [mockPatient], pageNumber: 0, pageSize: 100, totalElements: 1, totalPages: 1, last: true } as unknown as Record<string, unknown>, message: 'ok', timestamp: '', requestId: 'r1' };

  function createComponent(overrides?: Record<string, unknown>) {
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: DoctorService, useValue: { getDoctorsWithSlots: vi.fn().mockReturnValue(of(mockDocResponse)), ...(overrides?.doctorService || {}) } },
        { provide: PatientService, useValue: { getPatients: vi.fn().mockReturnValue(of(mockPatientPaged)), ...(overrides?.patientService || {}) } },
        { provide: AppointmentService, useValue: { createAppointment: vi.fn().mockReturnValue(of({ success: true, data: {}, message: 'ok', timestamp: '', requestId: 'r1' })), ...(overrides?.appointmentService || {}) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    return TestBed.runInInjectionContext(() => new BookingFlow());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.step).toBe(1);
    expect(component.isLoading).toBe(false);
    expect(component.isSubmitting).toBe(false);
    expect(component.doctors).toEqual([]);
    expect(component.patients).toEqual([]);
  });

  it('should load doctors and patients on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.doctors).toEqual([mockDoc]);
    expect(component.patients).toEqual([mockPatient]);
  });

  it('should compute selectedDoctorSlots', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectDoctor('d1');
    expect(component.selectedDoctorSlots).toEqual(['09:00', '10:00']);
  });

  it('should return empty slots for unknown doctor', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.selectedDoctorSlots).toEqual([]);
  });

  it('should select doctor and clear time', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectDoctor('d1');
    expect(component.bookingForm.get('doctorId')?.value).toBe('d1');
    expect(component.bookingForm.get('appointmentTime')?.value).toBe('');
  });

  it('should select date and reload doctors', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectDate('2023-10-25');
    expect(component.selectedDate).toBe('2023-10-25');
    expect(component.bookingForm.get('appointmentDate')?.value).toBe('2023-10-25');
  });

  it('should select time', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectTime('09:00');
    expect(component.bookingForm.get('appointmentTime')?.value).toBe('09:00');
  });

  it('should compute getInitials', () => {
    const component = createComponent();
    expect(component.getInitials('Rahul Sharma')).toBe('RS');
    expect(component.getInitials('')).toBe('');
  });

  it('should advance to step 2 when bookingForm is valid', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectDoctor('d1');
    component.selectTime('09:00');
    component.nextStep();
    expect(component.step).toBe(2);
  });

  it('should not advance step 1 if form invalid', () => {
    const component = createComponent();
    component.nextStep();
    expect(component.step).toBe(1);
  });

  it('should advance to step 3 with existing patient selected', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectDoctor('d1');
    component.selectTime('09:00');
    component.nextStep();
    component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
    component.nextStep();
    expect(component.step).toBe(3);
  });

  it('should not advance from step 2 without patient selection', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectDoctor('d1');
    component.selectTime('09:00');
    component.nextStep();
    expect(component.step).toBe(2);
    component.nextStep();
    expect(component.step).toBe(2);
  });

  it('should go to previous step', () => {
    const component = createComponent();
    component.step = 3;
    component.prevStep();
    expect(component.step).toBe(2);
    component.prevStep();
    expect(component.step).toBe(1);
    component.prevStep();
    expect(component.step).toBe(1);
  });

  it('should confirm booking and navigate', () => {
    const component = createComponent();
    component.ngOnInit();
    component.bookingForm.patchValue({ doctorId: 'd1', appointmentDate: '2023-10-24', appointmentTime: '09:00' });
    component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
    component.confirmBooking();
    expect(component.isSubmitting).toBe(false);
  });

  it('should handle booking error', () => {
    const component = createComponent({
      appointmentService: { createAppointment: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) },
    });
    component.ngOnInit();
    component.bookingForm.patchValue({ doctorId: 'd1', appointmentDate: '2023-10-24', appointmentTime: '09:00' });
    component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
    component.confirmBooking();
    expect(component.isSubmitting).toBe(false);
  });
});
