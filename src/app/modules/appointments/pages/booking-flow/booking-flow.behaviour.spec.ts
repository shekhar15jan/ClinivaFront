import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { DoctorService } from '../../../../core/services/doctor.service';
import { PatientService } from '../../../../core/services/patient.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { BookingFlow, buildDates, hm } from './booking-flow';

const ok = <T>(data: T) => ({ success: true, data, message: 'ok', timestamp: '', requestId: 'r' });

describe('BookingFlow behaviour', () => {
  const doctor = { doctor: { id: 'd1', fullName: 'Dr. Anita', specialization: 'Cardiologist', qualification: 'MD', consultationFeeInPaisa: 1, isActive: true }, availability: [] };
  const patient = { id: 'p1', patientId: 'CLV-1', fullName: 'Rahul Rao', dateOfBirth: '1990-01-01', age: 36, gender: 'MALE', phone: '9876543210' };

  let doctors: Record<string, ReturnType<typeof vi.fn>>;
  let patients: Record<string, ReturnType<typeof vi.fn>>;
  let appointments: Record<string, ReturnType<typeof vi.fn>>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  function create() {
    doctors = { getDoctorsWithSlots: vi.fn().mockReturnValue(of(ok([doctor]))) };
    patients = {
      getPatients: vi.fn().mockReturnValue(of(ok({ content: [patient], pageNumber: 0, pageSize: 100, totalElements: 1, totalPages: 1, last: true }))),
      createPatient: vi.fn().mockReturnValue(of(ok({ ...patient, id: 'new-1', fullName: 'Walk In' }))),
    };
    appointments = { createAppointment: vi.fn().mockReturnValue(of(ok({}))) };
    toast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: DoctorService, useValue: doctors },
        { provide: PatientService, useValue: patients },
        { provide: AppointmentService, useValue: appointments },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => null }, pathFromRoot: [{ paramMap: { get: (k: string) => (k === 'hospitalCode' ? 'sai-clinic' : null) } }] },
            queryParams: of({}),
          },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new BookingFlow());
    component.ngOnInit();
    component.bookingForm.patchValue({ doctorId: 'd1', appointmentDate: '2026-09-21', appointmentTime: '09:30:00' });
    return component;
  }

  describe('the dates offered', () => {
    it('are the next seven days starting today, not the three fixed days in October 2023 it used to offer', () => {
      const today = new Date();
      const first = buildDates(today)[0].fullDate;
      const local = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(first).toBe(local);
      const component = create();
      expect(component.dates).toHaveLength(7);
      expect(component.dates[0].fullDate).toBe(local);
      expect(component.dates.some((d) => d.fullDate.startsWith('2023'))).toBe(false);
    });

    it('carry across a month and a year end', () => {
      expect(buildDates(new Date(2026, 8, 28), 4).map((d) => d.fullDate)).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']);
      expect(buildDates(new Date(2026, 11, 30), 4).map((d) => d.fullDate)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02']);
    });

    it('handle a leap day', () => {
      expect(buildDates(new Date(2028, 1, 28), 3).map((d) => d.fullDate)).toEqual(['2028-02-28', '2028-02-29', '2028-03-01']);
    });

    it('label the weekday and day of month', () => {
      const [d] = buildDates(new Date(2026, 8, 21), 1);
      expect(d).toMatchObject({ day: '21', dayName: 'Mon', label: 'Sep' });
    });

    it('start with today selected and the doctors loaded for it', () => {
      const component = create();
      expect(component.selectedDate).toBe(component.dates[0].fullDate);
      expect(doctors['getDoctorsWithSlots']).toHaveBeenCalledWith(component.dates[0].fullDate);
    });
  });

  describe('what the confirmation shows', () => {
    it('names the doctor and the patient, not their database ids', () => {
      const component = create();
      component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
      expect(component.selectedDoctorLabel).toBe('Dr. Anita (Cardiologist)');
      expect(component.selectedPatientLabel).toBe('Rahul Rao (9876543210)');
    });

    it('describes a walk-in patient by what was typed', () => {
      const component = create();
      component.patientForm.patchValue({ patientMode: 'new', fullName: 'Walk In', phone: '9000000000' });
      expect(component.selectedPatientLabel).toBe('New patient: Walk In (9000000000)');
    });

    it('is empty rather than an id when nothing is chosen yet', () => {
      const component = create();
      component.bookingForm.patchValue({ doctorId: '' });
      expect(component.selectedDoctorLabel).toBe('');
      expect(component.selectedPatientLabel).toBe('');
    });

    it('shows times without seconds', () => {
      expect(hm('09:30:00')).toBe('09:30');
      expect(hm('09:30')).toBe('09:30');
      expect(hm(undefined as unknown as string)).toBe('');
    });
  });

  describe('booking an existing patient', () => {
    it('books exactly the patient that was chosen', () => {
      const component = create();
      component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
      component.confirmBooking();

      expect(patients['createPatient']).not.toHaveBeenCalled();
      expect(appointments['createAppointment']).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: 'p1', doctorId: 'd1', appointmentDate: '2026-09-21', appointmentTime: '09:30:00' }),
      );
      expect(toast.success).toHaveBeenCalledWith('Appointment booked successfully');
      // Inside the clinic: a bare '/appointments' was read as a clinic called "appointments" and sent the user to the login page.
      expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'appointments']);
    });

    it('refuses to book when no patient was chosen, instead of picking the first one on the list', () => {
      const component = create();
      component.patientForm.patchValue({ patientMode: 'existing', patientId: '' });
      component.confirmBooking();

      expect(appointments['createAppointment']).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Choose a patient first.');
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('booking a walk-in patient', () => {
    it('registers the patient first and books that new patient, never someone else', () => {
      const component = create();
      component.patientForm.patchValue({ patientMode: 'new', fullName: 'Walk In', phone: '9000000000', gender: 'FEMALE' });
      component.confirmBooking();

      expect(patients['createPatient']).toHaveBeenCalledWith({ fullName: 'Walk In', phone: '9000000000', gender: 'FEMALE' });
      const booked = appointments['createAppointment'].mock.calls[0][0];
      expect(booked.patientId).toBe('new-1');
      expect(booked.patientId).not.toBe('p1'); // p1 is the first patient on the list
    });

    it('books nothing when the patient cannot be registered, and says why', () => {
      const component = create();
      patients['createPatient'].mockReturnValue(throwError(() => ({ error: { message: 'Phone is already registered' } })));
      component.patientForm.patchValue({ patientMode: 'new', fullName: 'Walk In', phone: '9000000000' });
      component.confirmBooking();

      expect(appointments['createAppointment']).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Phone is already registered');
      expect(component.isSubmitting).toBe(false);
    });

    it('treats a registration the API declines as a failure', () => {
      const component = create();
      patients['createPatient'].mockReturnValue(of({ success: false, data: null, message: 'Invalid phone', timestamp: '', requestId: '' }));
      component.patientForm.patchValue({ patientMode: 'new', fullName: 'Walk In', phone: 'x' });
      component.confirmBooking();

      expect(appointments['createAppointment']).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Invalid phone');
    });
  });

  describe('when the booking fails', () => {
    it('shows the reason the server gave, such as a slot that was just taken', () => {
      const component = create();
      appointments['createAppointment'].mockReturnValue(throwError(() => ({ error: { message: 'That slot is already booked' } })));
      component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
      component.confirmBooking();

      expect(toast.error).toHaveBeenCalledWith('That slot is already booked');
      expect(component.isSubmitting).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('falls back to a plain message when the server gives none', () => {
      const component = create();
      appointments['createAppointment'].mockReturnValue(throwError(() => ({})));
      component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
      component.confirmBooking();

      expect(toast.error).toHaveBeenCalledWith('Failed to book appointment');
    });

    it('ignores a second click while the first booking is in flight', () => {
      const component = create();
      component.patientForm.patchValue({ patientMode: 'existing', patientId: 'p1' });
      component.isSubmitting = true;
      component.confirmBooking();
      expect(appointments['createAppointment']).not.toHaveBeenCalled();
    });
  });
});
