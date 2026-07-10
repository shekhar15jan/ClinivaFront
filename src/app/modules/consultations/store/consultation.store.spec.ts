import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ConsultationStore } from './consultation.store';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation, CreateConsultationRequest, Vitals } from '../../../core/models/consultation.model';
import { ApiResponse } from '../../../core/models/common.model';

describe('ConsultationStore', () => {
  let store: InstanceType<typeof ConsultationStore>;
  let mockConsultationService: Partial<ConsultationService>;

  const mockConsultation: Consultation = {
    id: 'c1',
    appointmentId: 'a1',
    patientId: 'p1',
    doctorId: 'd1',
    chiefComplaints: 'Headache',
    status: 'IN_PROGRESS',
    createdAt: '2026-07-15T10:00:00Z',
  };

  const mockApiResponse: ApiResponse<Consultation> = {
    success: true,
    data: mockConsultation,
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockConsultationService = {
      getByAppointment: vi.fn().mockReturnValue(of(mockApiResponse)),
      createConsultation: vi.fn().mockReturnValue(of(mockApiResponse)),
      updateConsultation: vi.fn().mockReturnValue(of(mockApiResponse)),
      recordVitals: vi.fn().mockReturnValue(of({
        ...mockApiResponse,
        data: { ...mockConsultation, vitals: { bloodPressureSystolic: 120, bloodPressureDiastolic: 80 } },
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        ConsultationStore,
        { provide: ConsultationService, useValue: mockConsultationService },
      ],
    });

    store = TestBed.inject(ConsultationStore);
  });

  it('should have initial state', () => {
    expect(store.consultation()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load consultation by appointment', fakeAsync(() => {
    store.loadConsultation('a1');
    tick();
    expect(store.consultation()).toEqual(mockConsultation);
    expect(store.loading()).toBe(false);
    expect(mockConsultationService.getByAppointment).toHaveBeenCalledWith('a1');
  }));

  it('should handle load consultation error', fakeAsync(() => {
    mockConsultationService.getByAppointment = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(ConsultationStore);
    errorStore.loadConsultation('a1');
    tick();
    expect(errorStore.error()).toBe('Not found');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should create consultation', fakeAsync(() => {
    const request: CreateConsultationRequest = { appointmentId: 'a1', chiefComplaints: 'Fever' };
    store.createConsultation(request);
    tick();
    expect(mockConsultationService.createConsultation).toHaveBeenCalledWith(request);
    expect(store.consultation()).toEqual(mockConsultation);
  }));

  it('should handle create consultation error', fakeAsync(() => {
    mockConsultationService.createConsultation = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(ConsultationStore);
    errorStore.createConsultation({ appointmentId: 'a1', chiefComplaints: 'Fever' });
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should update consultation', fakeAsync(() => {
    store.updateConsultation({ id: 'c1', consultation: { diagnosis: 'Migraine' } });
    tick();
    expect(mockConsultationService.updateConsultation).toHaveBeenCalledWith('c1', { diagnosis: 'Migraine' });
    expect(store.consultation()).toEqual(mockConsultation);
  }));

  it('should handle update consultation error', fakeAsync(() => {
    mockConsultationService.updateConsultation = vi.fn().mockReturnValue(throwError(() => new Error('Update failed')));
    const errorStore = TestBed.inject(ConsultationStore);
    errorStore.updateConsultation({ id: 'c1', consultation: { diagnosis: 'Bad' } });
    tick();
    expect(errorStore.error()).toBe('Update failed');
  }));

  it('should record vitals', fakeAsync(() => {
    const vitals: Vitals = { bloodPressureSystolic: 120, bloodPressureDiastolic: 80 };
    store.recordVitals({ appointmentId: 'a1', vitals });
    tick();
    expect(mockConsultationService.recordVitals).toHaveBeenCalledWith('a1', vitals);
    expect(store.consultation()?.vitals?.bloodPressureSystolic).toBe(120);
  }));

  it('should handle record vitals error', fakeAsync(() => {
    mockConsultationService.recordVitals = vi.fn().mockReturnValue(throwError(() => new Error('Vitals failed')));
    const errorStore = TestBed.inject(ConsultationStore);
    errorStore.recordVitals({ appointmentId: 'a1', vitals: {} });
    tick();
    expect(errorStore.error()).toBe('Vitals failed');
  }));

  it('should clear consultation', () => {
    store.clearConsultation();
    expect(store.consultation()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
