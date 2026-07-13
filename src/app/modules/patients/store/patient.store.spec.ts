import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { PatientStore } from './patient.store';
import { PatientService } from '../../../core/services/patient.service';
import { Patient } from '../../../core/models/patient.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

describe('PatientStore', () => {
  let store: InstanceType<typeof PatientStore>;
  let mockPatientService: Partial<PatientService>;

  const mockPatient: Patient = {
    id: 'p1',
    patientId: 'CLV-001',
    fullName: 'John Doe',
    dateOfBirth: '1990-01-01',
    age: 36,
    gender: 'MALE',
    phone: '9876543210',
  };

  const mockPagedResponse: ApiResponse<PagedResponse<Patient>> = {
    success: true,
    data: {
      content: [mockPatient],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    },
    message: 'success',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockPatientService = {
      getPatients: vi.fn().mockReturnValue(of(mockPagedResponse)),
      getPatientById: vi.fn().mockReturnValue(of({ success: true, data: mockPatient, message: 'ok', timestamp: '', requestId: 'r1' })),
      createPatient: vi.fn().mockReturnValue(of({ success: true, data: mockPatient, message: 'created', timestamp: '', requestId: 'r1' })),
      updatePatient: vi.fn().mockReturnValue(of({ success: true, data: mockPatient, message: 'updated', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        PatientStore,
        { provide: PatientService, useValue: mockPatientService },
      ],
    });

    store = TestBed.inject(PatientStore);
  });

  it('should have initial state', () => {
    expect(store.patients()).toEqual([]);
    expect(store.selectedPatient()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.totalElements()).toBe(0);
    expect(store.currentPage()).toBe(0);
  });

  it('should have computed hasPatients false initially', () => {
    expect(store.hasPatients()).toBe(false);
  });

  it('should load patients successfully', fakeAsync(() => {
    store.loadPatients({ page: 0, size: 20 });
    tick();
    expect(store.patients()).toEqual([mockPatient]);
    expect(store.totalElements()).toBe(1);
    expect(store.currentPage()).toBe(0);
    expect(store.loading()).toBe(false);
    expect(store.hasPatients()).toBe(true);
  }));

  it('should load patients with default params', fakeAsync(() => {
    store.loadPatients();
    tick();
    expect(mockPatientService.getPatients).toHaveBeenCalledWith(0, 20);
  }));

  it('should handle load patients error', fakeAsync(() => {
    mockPatientService.getPatients = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(PatientStore);
    errorStore.loadPatients({ page: 0, size: 20 });
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should load single patient', fakeAsync(() => {
    store.loadPatient('p1');
    tick();
    expect(store.selectedPatient()).toEqual(mockPatient);
    expect(store.loading()).toBe(false);
  }));

  it('should handle load patient error', fakeAsync(() => {
    mockPatientService.getPatientById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(PatientStore);
    errorStore.loadPatient('p1');
    tick();
    expect(errorStore.error()).toBe('Not found');
    expect(errorStore.selectedPatient()).toBeNull();
  }));

  it('should create patient', fakeAsync(() => {
    store.loadPatients({ page: 0, size: 20 });
    tick();
    const initialCount = store.totalElements();
    store.createPatient({ fullName: 'New Patient' } as Partial<Patient>);
    tick();
    expect(mockPatientService.createPatient).toHaveBeenCalled();
    expect(store.totalElements()).toBe(initialCount + 1);
    expect(store.loading()).toBe(false);
  }));

  it('should handle create patient error', fakeAsync(() => {
    mockPatientService.createPatient = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(PatientStore);
    errorStore.createPatient({ fullName: 'Bad' } as Partial<Patient>);
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should update patient', fakeAsync(() => {
    store.loadPatients({ page: 0, size: 20 });
    tick();
    store.updatePatient({ id: 'p1', patient: { fullName: 'Updated' } });
    tick();
    expect(mockPatientService.updatePatient).toHaveBeenCalledWith('p1', { fullName: 'Updated' });
    expect(store.loading()).toBe(false);
  }));

  it('should handle update patient error', fakeAsync(() => {
    mockPatientService.updatePatient = vi.fn().mockReturnValue(throwError(() => new Error('Update failed')));
    const errorStore = TestBed.inject(PatientStore);
    errorStore.updatePatient({ id: 'p1', patient: { fullName: 'Bad' } });
    tick();
    expect(errorStore.error()).toBe('Update failed');
  }));

  it('should clear selected patient', () => {
    store.loadPatient('p1');
    store.clearSelectedPatient();
    expect(store.selectedPatient()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
