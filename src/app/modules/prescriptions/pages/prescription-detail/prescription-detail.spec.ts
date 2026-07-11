import { TestBed } from '@angular/core/testing';
import { PrescriptionDetail } from './prescription-detail';
import { ActivatedRoute } from '@angular/router';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('PrescriptionDetail', () => {
  const mockPrescription = {
    id: 'rx-001', consultationId: 'c1', appointmentId: 'a1', patientId: 'p1',
    patientName: 'Rahul Sharma', doctorId: 'd1', doctorName: 'Dr. Anita Desai',
    diagnosis: 'Fever', date: '2026-06-25', notes: 'Rest advised',
    medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5 days', durationUnit: 'DAYS' }],
    createdAt: '2026-06-25T10:30:00', tenantId: 't1',
  };

  function createComponent(routeId = 'rx-001', overrides?: Partial<PrescriptionService>) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PrescriptionService,
          useValue: {
            getPrescriptionById: vi.fn().mockReturnValue(of({ success: true, data: mockPrescription })),
            downloadPdf: vi.fn().mockReturnValue(of(new Blob([]))),
            ...overrides,
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
      ],
    });
    return TestBed.runInInjectionContext(() => new PrescriptionDetail());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.prescription).toBeUndefined();
    expect(component.isLoading).toBe(false);
    expect(component.isDownloading).toBe(false);
  });

  it('should load prescription from route param on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.prescription).toBeDefined();
    expect(component.prescription!.patientName).toBe('Rahul Sharma');
  });

  it('should handle not found', () => {
    const component = createComponent('unknown', {
      getPrescriptionById: vi.fn().mockReturnValue(of({ success: false, data: null, message: 'Not found', timestamp: '', requestId: '' })),
    });
    component.ngOnInit();
    expect(component.prescription).toBeUndefined();
    expect(component.error).toBe('Prescription not found');
  });

  it('should handle load error', () => {
    const component = createComponent('rx-001', {
      getPrescriptionById: vi.fn().mockReturnValue(of({ success: false })),
    });
    component.ngOnInit();
    expect(component.error).toBe('Prescription not found');
  });
});
