import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { PrescriptionStore } from './prescription.store';
import { PrescriptionService } from '../../../core/services/prescription.service';
import { Prescription, CreatePrescriptionRequest } from '../../../core/models/prescription.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

describe('PrescriptionStore', () => {
  let store: InstanceType<typeof PrescriptionStore>;
  let mockPrescriptionService: Partial<PrescriptionService>;

  const mockPrescription: Prescription = {
    id: 'rx1',
    consultationId: 'c1',
    patient: { id: 'p1', fullName: 'John Doe' },
    doctor: { id: 'd1', fullName: 'Dr. Smith' },
    medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'BD', duration: 5, durationUnit: 'days' }],
    createdAt: '2026-07-15T10:00:00Z',
  };

  const mockPagedResponse: ApiResponse<PagedResponse<Prescription>> = {
    success: true,
    data: {
      content: [mockPrescription],
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

  const mockListResponse: ApiResponse<Prescription[]> = {
    success: true,
    data: [mockPrescription],
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockPrescriptionService = {
      getPrescriptions: vi.fn().mockReturnValue(of(mockPagedResponse)),
      getPrescriptionById: vi.fn().mockReturnValue(of({ success: true, data: mockPrescription, message: 'ok', timestamp: '', requestId: 'r1' })),
      getPrescriptionsByPatient: vi.fn().mockReturnValue(of(mockListResponse)),
      createPrescription: vi.fn().mockReturnValue(of({ success: true, data: mockPrescription, message: 'created', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        PrescriptionStore,
        { provide: PrescriptionService, useValue: mockPrescriptionService },
      ],
    });

    store = TestBed.inject(PrescriptionStore);
  });

  it('should have initial state', () => {
    expect(store.prescriptions()).toEqual([]);
    expect(store.selectedPrescription()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.totalElements()).toBe(0);
    expect(store.currentPage()).toBe(0);
  });

  it('should have computed false initially', () => {
    expect(store.hasPrescriptions()).toBe(false);
  });

  it('should load prescriptions successfully', fakeAsync(() => {
    store.loadPrescriptions({ page: 0, size: 20 });
    tick();
    expect(store.prescriptions()).toEqual([mockPrescription]);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.hasPrescriptions()).toBe(true);
  }));

  it('should load prescriptions with default params', fakeAsync(() => {
    store.loadPrescriptions();
    tick();
    expect(mockPrescriptionService.getPrescriptions).toHaveBeenCalledWith(0, 20);
  }));

  it('should handle load prescriptions error', fakeAsync(() => {
    mockPrescriptionService.getPrescriptions = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(PrescriptionStore);
    errorStore.loadPrescriptions();
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should load single prescription', fakeAsync(() => {
    store.loadPrescription('rx1');
    tick();
    expect(store.selectedPrescription()).toEqual(mockPrescription);
  }));

  it('should handle load prescription error', fakeAsync(() => {
    mockPrescriptionService.getPrescriptionById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(PrescriptionStore);
    errorStore.loadPrescription('rx1');
    tick();
    expect(errorStore.error()).toBe('Not found');
  }));

  it('should load prescriptions by patient', fakeAsync(() => {
    store.loadPrescriptionsByPatient('p1');
    tick();
    expect(store.prescriptions()).toEqual([mockPrescription]);
    expect(mockPrescriptionService.getPrescriptionsByPatient).toHaveBeenCalledWith('p1');
  }));

  it('should handle load by patient error', fakeAsync(() => {
    mockPrescriptionService.getPrescriptionsByPatient = vi.fn().mockReturnValue(throwError(() => new Error('Patient load failed')));
    const errorStore = TestBed.inject(PrescriptionStore);
    errorStore.loadPrescriptionsByPatient('p1');
    tick();
    expect(errorStore.error()).toBe('Patient load failed');
  }));

  it('should create prescription', fakeAsync(() => {
    store.loadPrescriptions();
    tick();
    const initialCount = store.prescriptions().length;
    const request: CreatePrescriptionRequest = { consultationId: 'c1', medicines: [] };
    store.createPrescription(request);
    tick();
    expect(mockPrescriptionService.createPrescription).toHaveBeenCalledWith(request);
    expect(store.prescriptions().length).toBe(initialCount + 1);
    expect(store.selectedPrescription()).toEqual(mockPrescription);
    expect(store.totalElements()).toBe(initialCount + 1);
  }));

  it('should handle create prescription error', fakeAsync(() => {
    mockPrescriptionService.createPrescription = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(PrescriptionStore);
    errorStore.createPrescription({ consultationId: 'c1', medicines: [] });
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should clear selected prescription', () => {
    store.clearSelectedPrescription();
    expect(store.selectedPrescription()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
