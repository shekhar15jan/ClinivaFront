import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { AppointmentCalendar, hm, localDay, shiftDay } from './appointment-calendar';

const appointment = (id: string, time: string, status: Appointment['status'] = 'PENDING'): Appointment => ({
  id,
  patient: { id: `p-${id}`, fullName: `Patient ${id}` },
  doctor: { id: 'd1', fullName: 'Dr. Anita', specialization: 'Cardiologist' },
  appointmentDate: '2026-09-21',
  appointmentTime: time,
  tokenNumber: 1,
  status,
});

const page = (items: Appointment[]) => ({ success: true, message: 'ok', timestamp: '', requestId: 'r', data: { content: items, pageNumber: 0, pageSize: 200, totalElements: items.length, totalPages: 1, last: true } });

describe('day helpers', () => {
  it('names the local day, not the UTC one', () => {
    expect(localDay(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05');
    expect(localDay(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });

  it('moves across month, year and leap-day ends', () => {
    expect(shiftDay('2026-09-30', 1)).toBe('2026-10-01');
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDay('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('shows times without seconds', () => {
    expect(hm('10:00:00')).toBe('10:00');
    expect(hm('09:30')).toBe('09:30');
    expect(hm(undefined as unknown as string)).toBe('');
  });
});

describe('AppointmentCalendar', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  function create(role = 'RECEPTIONIST', items: Appointment[] = [appointment('b', '11:00:00'), appointment('a', '09:30:00', 'APPROVED')]) {
    service = {
      getAppointments: vi.fn().mockReturnValue(of(page(items))),
      approveAppointment: vi.fn().mockReturnValue(of({ success: true })),
      rejectAppointment: vi.fn().mockReturnValue(of({ success: true })),
      cancelAppointment: vi.fn().mockReturnValue(of({ success: true })),
    };
    toast = { success: vi.fn(), error: vi.fn() };
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AppointmentService, useValue: service },
        { provide: AuthService, useValue: { currentUserValue: { role } } },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [{ paramMap: { get: (k: string) => (k === 'hospitalCode' ? 'sai-clinic' : null) } }] } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new AppointmentCalendar());
    component.ngOnInit();
    return component;
  }

  it('asks for just the chosen day, and lists it in time order', () => {
    const component = create();
    const today = localDay(new Date());
    expect(service['getAppointments']).toHaveBeenCalledWith(0, 200, undefined, undefined, today, today);
    expect(component.appointments.map((a) => a.id)).toEqual(['a', 'b']);
    expect(component.isLoading).toBe(false);
  });

  it('opens on today, and moves a day at a time', () => {
    const component = create();
    const today = localDay(new Date());
    expect(component.isToday).toBe(true);
    component.nextDay();
    expect(component.selectedDay).toBe(shiftDay(today, 1));
    expect(service['getAppointments']).toHaveBeenLastCalledWith(0, 200, undefined, undefined, shiftDay(today, 1), shiftDay(today, 1));
    component.previousDay();
    component.previousDay();
    expect(component.selectedDay).toBe(shiftDay(today, -1));
    component.today();
    expect(component.selectedDay).toBe(today);
  });

  it('does not reload when the same day is chosen again or the date box is cleared', () => {
    const component = create();
    const calls = service['getAppointments'].mock.calls.length;
    component.goTo(component.selectedDay);
    component.goTo('');
    expect(service['getAppointments'].mock.calls.length).toBe(calls);
  });

  it('counts what is waiting for approval', () => {
    expect(create().pendingCount).toBe(1);
  });

  it('shows the reason and lets the user retry when the list cannot be loaded', () => {
    const component = create();
    service['getAppointments'].mockReturnValue(throwError(() => ({ error: { message: 'Module is not active' } })));
    component.loadData();
    expect(component.loadError).toBe('Module is not active');
    expect(component.isLoading).toBe(false);
  });

  describe('approving, rejecting and cancelling', () => {
    it('approves, confirms, and reloads the day', () => {
      const component = create();
      const calls = service['getAppointments'].mock.calls.length;
      component.approve(appointment('b', '11:00:00'));
      expect(service['approveAppointment']).toHaveBeenCalledWith('b');
      expect(toast.success).toHaveBeenCalledWith('Appointment approved');
      expect(service['getAppointments'].mock.calls.length).toBe(calls + 1);
      expect(component.busyId).toBeNull();
    });

    it('rejects and reloads', () => {
      const component = create();
      component.reject(appointment('b', '11:00:00'));
      expect(service['rejectAppointment']).toHaveBeenCalledWith('b');
      expect(toast.success).toHaveBeenCalledWith('Appointment rejected');
    });

    it('says why when the server refuses, and does not reload', () => {
      const component = create();
      service['approveAppointment'].mockReturnValue(throwError(() => ({ error: { message: 'Doctor is not available' } })));
      const calls = service['getAppointments'].mock.calls.length;
      component.approve(appointment('b', '11:00:00'));
      expect(toast.error).toHaveBeenCalledWith('Doctor is not available');
      expect(service['getAppointments'].mock.calls.length).toBe(calls);
      expect(component.busyId).toBeNull();
    });

    it('cancels only after the user confirms', () => {
      const component = create();
      const target = appointment('b', '11:00:00');
      component.askCancel(target);
      expect(service['cancelAppointment']).not.toHaveBeenCalled();
      component.cancel();
      expect(service['cancelAppointment']).toHaveBeenCalledWith('b');
      expect(toast.success).toHaveBeenCalledWith('Appointment cancelled');
      expect(component.toCancel).toBeNull();
    });

    it('does nothing when cancel is confirmed with nothing selected', () => {
      const component = create();
      component.cancel();
      expect(service['cancelAppointment']).not.toHaveBeenCalled();
    });
  });

  describe('rescheduling', () => {
    it('frees the slot and opens the booking screen inside the clinic with the doctor and patient chosen', () => {
      const component = create();
      component.reschedule(appointment('b', '11:00:00'));
      expect(service['cancelAppointment']).toHaveBeenCalledWith('b');
      // A bare 'book' was read as a clinic called "book" and sent the user to the sign-in page.
      expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'appointments', 'book'], {
        queryParams: { doctorId: 'd1', patientId: 'p-b', rescheduleFrom: 'b' },
      });
    });

    it('stays on the calendar and explains when the slot cannot be freed', () => {
      const component = create();
      service['cancelAppointment'].mockReturnValue(throwError(() => ({ error: { message: 'Already completed' } })));
      component.reschedule(appointment('b', '11:00:00'));
      expect(toast.error).toHaveBeenCalledWith('Already completed');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.busyId).toBeNull();
    });
  });

  describe('who can do what', () => {
    it('lets the front desk manage bookings', () => {
      const component = create('RECEPTIONIST');
      expect(component.canManage).toBe(true);
      expect(component.isDoctor).toBe(false);
    });

    it('lets an administrator manage bookings', () => {
      expect(create('ADMIN').canManage).toBe(true);
    });

    it('gives a doctor consultations but not booking management', () => {
      const component = create('DOCTOR');
      expect(component.canManage).toBe(false);
      expect(component.isDoctor).toBe(true);
    });
  });
});
