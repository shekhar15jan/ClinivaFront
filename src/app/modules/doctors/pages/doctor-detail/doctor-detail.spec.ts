import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DoctorService } from '../../../../core/services/doctor.service';
import { ApiResponse } from '../../../../core/models/common.model';
import { Doctor } from '../../../../core/models/doctor.model';
import { DEFAULT_END, DEFAULT_START, DoctorDetail, ScheduleDay, scheduleFrom, scheduleProblem, toHm } from './doctor-detail';

const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data, message: 'ok', timestamp: '', requestId: 'r1' });

describe('DoctorDetail', () => {
  const mockDoctor: Doctor = {
    id: 'd1', fullName: 'Dr. Anita Desai', specialization: 'Cardiologist',
    qualification: 'MD', consultationFeeInPaisa: 50000, isActive: true,
    phone: '9876543210', email: 'anita@test.com',
  };

  let service: Record<string, ReturnType<typeof vi.fn>>;

  function create(routeId: string | null = 'd1') {
    service = {
      getDoctorById: vi.fn().mockReturnValue(of(ok(mockDoctor))),
      getAvailability: vi.fn().mockReturnValue(of(ok([]))),
      setAvailability: vi.fn().mockReturnValue(of(ok(null))),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: DoctorService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
      ],
    });
    return TestBed.runInInjectionContext(() => new DoctorDetail());
  }

  describe('loading', () => {
    it('shows the real doctor and starts with no hours switched on', () => {
      const component = create();
      component.ngOnInit();
      expect(component.doctor).toEqual(mockDoctor);
      expect(component.isLoading).toBe(false);
      expect(component.schedule.filter((d) => d.enabled)).toEqual([]);
    });

    it('does not carry the made-up figures the page used to show for every doctor', () => {
      const component = create();
      expect((component as unknown as Record<string, unknown>)['todayAppointments']).toBeUndefined();
      expect((component as unknown as Record<string, unknown>)['experience']).toBeUndefined();
      expect((component as unknown as Record<string, unknown>)['weekDays']).toBeUndefined();
    });

    it('does nothing without an id in the route', () => {
      const component = create(null);
      component.ngOnInit();
      expect(service['getDoctorById']).not.toHaveBeenCalled();
    });

    it('survives a failed doctor load', () => {
      const component = create();
      service['getDoctorById'].mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();
      expect(component.isLoading).toBe(false);
      expect(component.doctor).toBeUndefined();
    });

    it("fills the schedule from the doctor's stored hours, dropping the seconds", () => {
      const component = create();
      service['getAvailability'].mockReturnValue(of(ok([
        { dayOfWeek: 'MONDAY', startTime: '09:00:00', endTime: '13:30:00' },
        { dayOfWeek: 'FRIDAY', startTime: '14:00:00', endTime: '18:00:00' },
      ])));
      component.ngOnInit();
      const monday = component.schedule.find((d) => d.key === 'MONDAY')!;
      expect(monday).toMatchObject({ enabled: true, start: '09:00', end: '13:30' });
      expect(component.schedule.find((d) => d.key === 'FRIDAY')).toMatchObject({ enabled: true, start: '14:00', end: '18:00' });
      expect(component.schedule.find((d) => d.key === 'TUESDAY')!.enabled).toBe(false);
    });

    it('says so when the stored schedule cannot be loaded', () => {
      const component = create();
      service['getAvailability'].mockReturnValue(throwError(() => new Error('down')));
      component.ngOnInit();
      expect(component.scheduleError).toContain('could not be loaded');
    });
  });

  describe('saving the schedule', () => {
    function loaded() {
      const component = create();
      component.ngOnInit();
      return component;
    }

    it('sends only the switched-on days, in the shape the API takes', () => {
      const component = loaded();
      component.schedule.find((d) => d.key === 'MONDAY')!.enabled = true;
      const wed = component.schedule.find((d) => d.key === 'WEDNESDAY')!;
      wed.enabled = true;
      wed.start = '10:00';
      wed.end = '12:00';

      component.saveSchedule();

      expect(service['setAvailability']).toHaveBeenCalledWith('d1', {
        availability: [
          { dayOfWeek: 'MONDAY', startTime: DEFAULT_START, endTime: DEFAULT_END },
          { dayOfWeek: 'WEDNESDAY', startTime: '10:00', endTime: '12:00' },
        ],
      });
      expect(component.saved).toBe(true);
      expect(component.isSaving).toBe(false);
      expect(component.scheduleError).toBe('');
    });

    it('can save an empty week, which closes every day', () => {
      const component = loaded();
      component.saveSchedule();
      expect(service['setAvailability']).toHaveBeenCalledWith('d1', { availability: [] });
    });

    it('refuses hours that end before they start and sends nothing', () => {
      const component = loaded();
      const tue = component.schedule.find((d) => d.key === 'TUESDAY')!;
      tue.enabled = true;
      tue.start = '17:00';
      tue.end = '09:00';

      component.saveSchedule();

      expect(component.scheduleError).toContain('Tuesday');
      expect(service['setAvailability']).not.toHaveBeenCalled();
      expect(component.saved).toBe(false);
    });

    it('shows the server message when the save is rejected', () => {
      const component = loaded();
      service['setAvailability'].mockReturnValue(throwError(() => ({ error: { message: 'Doctor not found' } })));
      component.saveSchedule();
      expect(component.scheduleError).toBe('Doctor not found');
      expect(component.saved).toBe(false);
      expect(component.isSaving).toBe(false);
    });

    it('falls back to a plain message when the server gives none', () => {
      const component = loaded();
      service['setAvailability'].mockReturnValue(throwError(() => ({})));
      component.saveSchedule();
      expect(component.scheduleError).toContain('could not be saved');
    });

    it('reports a save the API answers with success=false', () => {
      const component = loaded();
      service['setAvailability'].mockReturnValue(of({ success: false, data: null, message: 'Nope', timestamp: '', requestId: '' }));
      component.saveSchedule();
      expect(component.scheduleError).toBe('Nope');
    });

    it('clears the "saved" note when saving again', () => {
      const component = loaded();
      component.saveSchedule();
      expect(component.saved).toBe(true);
      const mon = component.schedule.find((d) => d.key === 'MONDAY')!;
      mon.enabled = true;
      mon.start = '18:00';
      mon.end = '08:00';
      component.saveSchedule();
      expect(component.saved).toBe(false);
    });
  });

  describe('schedule helpers', () => {
    it('toHm trims HH:mm:ss and tolerates nothing', () => {
      expect(toHm('09:30:00')).toBe('09:30');
      expect(toHm('09:30')).toBe('09:30');
      expect(toHm(undefined as unknown as string)).toBe('');
    });

    it('scheduleFrom always yields the seven days in order', () => {
      expect(scheduleFrom([]).map((d) => d.key)).toEqual([
        'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
      ]);
    });

    it.each<[string, Partial<ScheduleDay>, string]>([
      ['a missing start', { start: '' }, 'start and an end'],
      ['a missing end', { end: '' }, 'start and an end'],
      ['equal times', { start: '09:00', end: '09:00' }, 'after the start'],
      ['a reversed range', { start: '12:00', end: '08:00' }, 'after the start'],
    ])('scheduleProblem rejects %s', (_label, change, message) => {
      const days = scheduleFrom([]);
      Object.assign(days[0], { enabled: true }, change);
      expect(scheduleProblem(days)).toContain(message);
    });

    it('scheduleProblem ignores days that are switched off, however odd their times', () => {
      const days = scheduleFrom([]);
      Object.assign(days[0], { enabled: false, start: '18:00', end: '06:00' });
      expect(scheduleProblem(days)).toBe('');
    });
  });
});
