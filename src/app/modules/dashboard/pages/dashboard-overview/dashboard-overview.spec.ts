import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LayoutStore } from '../../../../core/store/layout.store';
import { AuthService } from '../../../../core/services/auth.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { ReportService } from '../../../../core/services/report.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { DashboardOverview, greetingFor, localDay, weekDays } from './dashboard-overview';

const appointment = (id: string, day: string, time: string, status: Appointment['status'] = 'APPROVED'): Appointment => ({
  id, patient: { id: 'p', fullName: `Patient ${id}` }, doctor: { id: 'd', fullName: 'Dr. Anita' },
  appointmentDate: day, appointmentTime: time, tokenNumber: 1, status,
});

describe('dashboard helpers', () => {
  it('names the local day, not the UTC one', () => {
    expect(localDay(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05');
  });

  it('lists Monday to Sunday of the week that holds the given day, across a month end', () => {
    // Wednesday 30 September 2026
    const days = weekDays(new Date(2026, 8, 30)).map((d) => d.day);
    expect(days).toEqual(['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  });

  it('starts a Sunday in the week before it', () => {
    const days = weekDays(new Date(2026, 8, 20)).map((d) => d.day); // Sunday
    expect(days[0]).toBe('2026-09-14');
    expect(days[6]).toBe('2026-09-20');
  });

  it('greets by the time of day', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(13)).toBe('Good afternoon');
    expect(greetingFor(20)).toBe('Good evening');
  });
});

describe('DashboardOverview', () => {
  const today = localDay(new Date());
  let appointments: { getAppointments: ReturnType<typeof vi.fn> };
  let reports: { getDashboardStats: ReturnType<typeof vi.fn> };
  let layout: { setFabConfig: ReturnType<typeof vi.fn> };

  function create(role: string, items: Appointment[] = [appointment('b', today, '11:00:00', 'PENDING'), appointment('a', today, '09:30:00')]) {
    appointments = { getAppointments: vi.fn().mockReturnValue(of({ success: true, data: { content: items } })) };
    reports = { getDashboardStats: vi.fn().mockReturnValue(of({ success: true, data: { totalPatients: 7, todayAppointments: 2, pendingBills: 3, totalRevenueInPaisa: 0, activeDoctors: 2 } })) };
    layout = { setFabConfig: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: LayoutStore, useValue: layout },
        { provide: AuthService, useValue: { currentUserValue: { role, email: 'x@clinic.test', profile: { firstName: 'Meera', lastName: 'Nair' } } } },
        { provide: AppointmentService, useValue: appointments },
        { provide: ReportService, useValue: reports },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new DashboardOverview());
    component.ngOnInit();
    return component;
  }

  it("shows today's appointments in time order, from the API, not a fixed picture", () => {
    const component = create('RECEPTIONIST');
    expect(component.todays.map((a) => a.id)).toEqual(['a', 'b']);
    expect(component.waiting).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('asks for the whole week and counts each day, leaving out cancelled and rejected bookings', () => {
    const monday = weekDays(new Date())[0].day;
    const component = create('ADMIN', [
      appointment('1', monday, '10:00:00'), appointment('2', monday, '11:00:00'),
      appointment('3', monday, '12:00:00', 'CANCELLED'), appointment('4', monday, '13:00:00', 'REJECTED'),
    ]);
    expect(appointments.getAppointments).toHaveBeenCalledWith(0, 500, undefined, undefined, monday, weekDays(new Date())[6].day);
    expect(component.weekCounts[0]).toBe(2);
    expect(component.barHeight(2)).toBe(100);
  });

  it('gives an administrator the clinic totals', () => {
    expect(create('ADMIN').stats?.totalPatients).toBe(7);
  });

  it('gives a doctor the clinic totals too', () => {
    expect(create('DOCTOR').stats?.activeDoctors).toBe(2);
  });

  it('does not call the reports API for a receptionist, who it would refuse', () => {
    const component = create('RECEPTIONIST');
    expect(reports.getDashboardStats).not.toHaveBeenCalled();
    expect(component.stats).toBeNull();
    expect(component.canManage).toBe(true);
  });

  it('calls nothing for a nurse, who may list neither', () => {
    const component = create('NURSE');
    expect(appointments.getAppointments).not.toHaveBeenCalled();
    expect(reports.getDashboardStats).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  });

  it('says why the appointments could not load', () => {
    const component = create('RECEPTIONIST');
    appointments.getAppointments.mockReturnValue(throwError(() => ({ error: { message: 'Module is not active: APPOINTMENT' } })));
    component.load();
    expect(component.error).toBe('Module is not active: APPOINTMENT');
    expect(component.isLoading).toBe(false);
  });

  it('greets the signed-in person by name', () => {
    expect(create('ADMIN').name).toBe('Meera Nair');
  });

  it('offers the New Appointment shortcut while open and removes it when leaving', () => {
    const component = create('ADMIN');
    expect(layout.setFabConfig).toHaveBeenCalledWith(expect.objectContaining({ route: 'appointments/book' }));
    component.ngOnDestroy();
    expect(layout.setFabConfig).toHaveBeenLastCalledWith(null);
  });
});
