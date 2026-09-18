import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { DoctorStore } from './doctor.store';
import { DoctorService } from '../../../core/services/doctor.service';
import { Doctor } from '../../../core/models/doctor.model';
import { ApiResponse } from '../../../core/models/common.model';

describe('DoctorStore', () => {
  let store: InstanceType<typeof DoctorStore>;
  let mockDoctorService: Partial<DoctorService>;

  const mockDoctor: Doctor = {
    id: 'd1',
    fullName: 'Dr. Smith',
    specialization: 'Cardiology',
    qualification: 'MD',
    consultationFeeInPaisa: 50000,
    isActive: true,
  };

  const mockPagedResponse: ApiResponse<{
    content: Doctor[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  }> = {
    success: true,
    data: { content: [mockDoctor], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1, last: true },
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockDoctorService = {
      getDoctors: vi.fn().mockReturnValue(of(mockPagedResponse)),
      getDoctorById: vi.fn().mockReturnValue(of({ success: true, data: mockDoctor, message: 'ok', timestamp: '', requestId: 'r1' })),
      createDoctor: vi.fn().mockReturnValue(of({ success: true, data: mockDoctor, message: 'created', timestamp: '', requestId: 'r1' })),
      updateDoctor: vi.fn().mockReturnValue(of({ success: true, data: mockDoctor, message: 'updated', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        DoctorStore,
        { provide: DoctorService, useValue: mockDoctorService },
      ],
    });

    store = TestBed.inject(DoctorStore);
  });

  it('should have initial state', () => {
    expect(store.doctors()).toEqual([]);
    expect(store.selectedDoctor()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should have computed false initially', () => {
    expect(store.hasDoctors()).toBe(false);
    expect(store.activeDoctors()).toEqual([]);
  });

  it('should load doctors successfully', fakeAsync(() => {
    store.loadDoctors();
    tick();
    expect(store.doctors()).toEqual([mockDoctor]);
    expect(store.loading()).toBe(false);
    expect(store.hasDoctors()).toBe(true);
    expect(store.activeDoctors()).toEqual([mockDoctor]);
  }));

  it('should handle load doctors error', fakeAsync(() => {
    mockDoctorService.getDoctors = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(DoctorStore);
    errorStore.loadDoctors();
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should load single doctor', fakeAsync(() => {
    store.loadDoctor('d1');
    tick();
    expect(store.selectedDoctor()).toEqual(mockDoctor);
  }));

  it('should handle load doctor error', fakeAsync(() => {
    mockDoctorService.getDoctorById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(DoctorStore);
    errorStore.loadDoctor('d1');
    tick();
    expect(errorStore.error()).toBe('Not found');
  }));

  it('should create doctor', fakeAsync(() => {
    store.loadDoctors();
    tick();
    const initialCount = store.doctors().length;
    store.createDoctor({ fullName: 'New Doc' } as Partial<Doctor>);
    tick();
    expect(mockDoctorService.createDoctor).toHaveBeenCalled();
    expect(store.doctors().length).toBe(initialCount + 1);
  }));

  it('should handle create doctor error', fakeAsync(() => {
    mockDoctorService.createDoctor = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(DoctorStore);
    errorStore.createDoctor({ fullName: 'Bad' } as Partial<Doctor>);
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should update doctor', fakeAsync(() => {
    store.loadDoctors();
    tick();
    store.updateDoctor({ id: 'd1', doctor: { specialization: 'Neurology' } });
    tick();
    expect(mockDoctorService.updateDoctor).toHaveBeenCalledWith('d1', { specialization: 'Neurology' });
  }));

  it('should handle update doctor error', fakeAsync(() => {
    mockDoctorService.updateDoctor = vi.fn().mockReturnValue(throwError(() => new Error('Update failed')));
    const errorStore = TestBed.inject(DoctorStore);
    errorStore.updateDoctor({ id: 'd1', doctor: { fullName: 'Bad' } });
    tick();
    expect(errorStore.error()).toBe('Update failed');
  }));

  it('should update selectedDoctor after update', fakeAsync(() => {
    store.loadDoctor('d1');
    tick();
    const updatedDoctor = { ...mockDoctor, specialization: 'Neurology' };
    mockDoctorService.updateDoctor = vi.fn().mockReturnValue(of({ success: true, data: updatedDoctor, message: 'updated', timestamp: '', requestId: 'r1' }));
    store.updateDoctor({ id: 'd1', doctor: { specialization: 'Neurology' } });
    tick();
    expect(store.selectedDoctor()?.specialization).toBe('Neurology');
  }));

  it('should compute activeDoctors filtering inactive', fakeAsync(() => {
    const inactiveDoctor: Doctor = { ...mockDoctor, id: 'd2', isActive: false };
    mockDoctorService.getDoctors = vi.fn().mockReturnValue(of({ ...mockPagedResponse, data: { content: [mockDoctor, inactiveDoctor], pageNumber: 0, pageSize: 20, totalElements: 2, totalPages: 1, last: true } }));
    store.loadDoctors();
    tick();
    expect(store.activeDoctors()).toEqual([mockDoctor]);
  }));

  it('should clear selected doctor', () => {
    store.loadDoctor('d1');
    store.clearSelectedDoctor();
    expect(store.selectedDoctor()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
