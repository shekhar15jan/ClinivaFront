import { TestBed } from '@angular/core/testing';
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
    patient: { id: 'p1', fullName: 'John Doe' },
    doctor: { id: 'd1', fullName: 'Dr. Smith' },
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

  it('should load appointments successfully', () => {
    store.loadAppointments({ page: 0, size: 20 });
    expect(store.appointments()).toEqual([mockAppointment]);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.hasAppointments()).toBe(true);
  });

  it('should load appointments with default params', () => {
    store.loadAppointments();
    expect(mockAppointmentService.getAppointments).toHaveBeenCalledWith(0, 20, undefined, undefined);
  });

  it('should handle load appointments error', () => {
    mockAppointmentService.getAppointments = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.loadAppointments();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  });

  it('should load single appointment', () => {
    store.loadAppointment('a1');
    expect(store.selectedAppointment()).toEqual(mockAppointment);
  });

  it('should handle load appointment error', () => {
    mockAppointmentService.getAppointmentById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.loadAppointment('a1');
    expect(errorStore.error()).toBe('Not found');
  });

  it('should create appointment', () => {
    store.loadAppointments();
    const initialCount = store.appointments().length;
    const request: CreateAppointmentRequest = { patientId: 'p1', doctorId: 'd1', appointmentDate: '2026-07-15', appointmentTime: '10:00' };
    store.createAppointment(request);
    expect(mockAppointmentService.createAppointment).toHaveBeenCalledWith(request);
    expect(store.appointments().length).toBe(initialCount + 1);
    expect(store.totalElements()).toBe(initialCount + 1);
  });

  it('should handle create appointment error', () => {
    mockAppointmentService.createAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.createAppointment({ patientId: 'p1', doctorId: 'd1', appointmentDate: '2026-07-15', appointmentTime: '10:00' });
    expect(errorStore.error()).toBe('Create failed');
  });

  it('should approve appointment', () => {
    store.loadAppointments();
    store.approveAppointment('a1');
    expect(mockAppointmentService.approveAppointment).toHaveBeenCalledWith('a1');
    expect(store.appointments()[0].status).toBe('APPROVED');
  });

  it('should handle approve appointment error', () => {
    mockAppointmentService.approveAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Approve failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.approveAppointment('a1');
    expect(errorStore.error()).toBe('Approve failed');
  });

  it('should cancel appointment', () => {
    store.loadAppointments();
    store.cancelAppointment('a1');
    expect(mockAppointmentService.cancelAppointment).toHaveBeenCalledWith('a1');
    expect(store.appointments()[0].status).toBe('CANCELLED');
  });

  it('should handle cancel appointment error', () => {
    mockAppointmentService.cancelAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Cancel failed')));
    const errorStore = TestBed.inject(AppointmentStore);
    errorStore.cancelAppointment('a1');
    expect(errorStore.error()).toBe('Cancel failed');
  });

  it('should compute pendingAppointments', () => {
    const approved: Appointment = { ...mockAppointment, id: 'a2', status: 'APPROVED' };
    mockAppointmentService.getAppointments = vi.fn().mockReturnValue(of({
      ...mockPagedResponse,
      data: { ...mockPagedResponse.data, content: [mockAppointment, approved], totalElements: 2 },
    }));
    store.loadAppointments();
    expect(store.pendingAppointments()).toEqual([mockAppointment]);
    expect(store.approvedAppointments()).toEqual([approved]);
  });

  it('should update selectedAppointment after approve', () => {
    store.loadAppointment('a1');
    store.approveAppointment('a1');
    expect(store.selectedAppointment()?.status).toBe('APPROVED');
  });

  it('should clear selected appointment', () => {
    store.clearSelectedAppointment();
    expect(store.selectedAppointment()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
