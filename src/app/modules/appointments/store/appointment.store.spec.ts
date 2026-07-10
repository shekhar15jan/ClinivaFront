import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { AppointmentStore } from './appointment.store';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, CreateAppointmentRequest } from '../../../core/models/appointment.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

describe('AppointmentStore', () => {
  let store: InstanceType<typeof AppointmentStore>;
  let mockAppointmentService: Partial<AppointmentService>;

  const mockAppointment: Appointment = {
    id: 'a1',
    patientId: 'p1',
    patientName: 'John Doe',
    doctorId: 'd1',
    doctorName: 'Dr. Smith',
    appointmentDate: '2026-07-15',
    appointmentTime: '10:00',
    tokenNumber: 1,
    status: 'PENDING',
  };

  const mockPagedResponse: ApiResponse<PagedResponse<Appointment>> = {
    success: true,
    data: {
      content: [mockAppointment],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    },
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockAppointmentService = {
      getAppointments: vi.fn().mockReturnValue(of(mockPagedResponse)),
      getAppointmentById: vi.fn().mockReturnValue(of({ success: true, data: mockAppointment, message: 'ok', timestamp: '', requestId: 'r1' })),
      createAppointment: vi.fn().mockReturnValue(of({ success: true, data: mockAppointment, message: 'created', timestamp: '', requestId: 'r1' })),
      approveAppointment: vi.fn().mockReturnValue(of({ success: true, data: { ...mockAppointment, status: 'APPROVED' }, message: 'approved', timestamp: '', requestId: 'r1' })),
      cancelAppointment: vi.fn().mockReturnValue(of({ success: true, data: { ...mockAppointment, status: 'CANCELLED' }, message: 'cancelled', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        AppointmentStore,
        { provide: AppointmentService, useValue: mockAppointmentService },
      ],
    });

    store = TestBed.inject(AppointmentStore);
  });

  it('should have initial state', () => {
    expect(store.appointments()).toEqual([]);
    expect(store.selectedAppointment()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.totalElements()).toBe(0);
    expect(store.currentPage()).toBe(0);
  });

  it('should have computed false initially', () => {
    expect(store.hasAppointments()).toBe(false);
    expect(store.pendingAppointments()).toEqual([]);
    expect(store.approvedAppointments()).toEqual([]);
  });

  it('should load appointments successfully', fakeAsync(() => {
    store.loadAppointments({ page: 0, size: 20 });
    tick();
    expect(store.appointments()).toEqual([mockAppointment]);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.hasAppointments()).toBe(true);
  }));

  it('should load appointments with default params', fakeAsync(() => {
    store.loadAppointments();
    tick();
    expect(mockAppointmentService.getAppointments).toHaveBeenCalledWith(0, 20, undefined, undefined);
  }));

  it('should handle load appointments error', fakeAsync(() => {
    mockAppointmentService.getAppointments = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.loadAppointments();
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should load single appointment', fakeAsync(() => {
    store.loadAppointment('a1');
    tick();
    expect(store.selectedAppointment()).toEqual(mockAppointment);
  }));

  it('should handle load appointment error', fakeAsync(() => {
    mockAppointmentService.getAppointmentById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.loadAppointment('a1');
    tick();
    expect(errorStore.error()).toBe('Not found');
  }));

  it('should create appointment', fakeAsync(() => {
    store.loadAppointments();
    tick();
    const initialCount = store.appointments().length;
    const request: CreateAppointmentRequest = { patientId: 'p1', doctorId: 'd1', appointmentDate: '2026-07-15', appointmentTime: '10:00' };
    store.createAppointment(request);
    tick();
    expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith(request);
    expect(store.appointments().length).toBe(initialCount + 1);
    expect(store.totalElements()).toBe(initialCount + 1);
  }));

  it('should handle create appointment error', fakeAsync(() => {
    mockAppointmentService.createAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.createAppointment({ patientId: 'p1', doctorId: 'd1', appointmentDate: '2026-07-15', appointmentTime: '10:00' });
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should approve appointment', fakeAsync(() => {
    store.loadAppointments();
    tick();
    store.approveAppointment('a1');
    tick();
    expect(mockAppointmentService.approveAppointment).toHaveBeenCalledWith('a1');
    expect(store.appointments()[0].status).toBe('APPROVED');
  }));

  it('should handle approve appointment error', fakeAsync(() => {
    mockAppointmentService.approveAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Approve failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.approveAppointment('a1');
    tick();
    expect(errorStore.error()).toBe('Approve failed');
  }));

  it('should cancel appointment', fakeAsync(() => {
    store.loadAppointments();
    tick();
    store.cancelAppointment('a1');
    tick();
    expect(mockAppointmentService.cancelAppointment).toHaveBeenCalledWith('a1');
    expect(store.appointments()[0].status).toBe('CANCELLED');
  }));

  it('should handle cancel appointment error', fakeAsync(() => {
    mockAppointmentService.cancelAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Cancel failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.cancelAppointment('a1');
    tick();
    expect(errorStore.error()).toBe('Cancel failed');
  }));

  it('should compute pendingAppointments', fakeAsync(() => {
    const approved: Appointment = { ...mockAppointment, id: 'a2', status: 'APPROVED' };
    mockAppointmentService.getAppointments = vi.fn().mockReturnValue(of({
      ...mockPagedResponse,
      data: { ...mockPagedResponse.data, content: [mockAppointment, approved], totalElements: 2 },
    }));
    store.loadAppointments();
    tick();
    expect(store.pendingAppointments()).toEqual([mockAppointment]);
    expect(store.approvedAppointments()).toEqual([approved]);
  }));

  it('should update selectedAppointment after approve', fakeAsync(() => {
    store.loadAppointment('a1');
    tick();
    store.approveAppointment('a1');
    tick();
    expect(store.selectedAppointment()?.status).toBe('APPROVED');
  }));

  it('should clear selected appointment', () => {
    store.clearSelectedAppointment();
    expect(store.selectedAppointment()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
