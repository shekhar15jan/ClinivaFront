import { TestBed } from '@angular/core/testing';
import { PrescriptionDetail } from './prescription-detail';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '../../../../core/services/billing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('PrescriptionDetail', () => {
  const mockPrescription = {
    id: 'rx-001', consultationId: 'c1', appointmentId: 'a1',
    patient: { id: 'p1', fullName: 'Rahul Sharma' },
    doctor: { id: 'd1', fullName: 'Dr. Anita Desai' },
    diagnosis: 'Fever', date: '2026-06-25', notes: 'Rest advised',
    medicines: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: 5, durationUnit: 'DAYS' }],
    createdAt: '2026-06-25T10:30:00',
  };

  let billing: { createBill: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn> };

  function createComponent(routeId = 'rx-001', overrides?: Partial<PrescriptionService>, role = 'ADMIN') {
    billing = { createBill: vi.fn().mockReturnValue(of({ success: true, data: { id: 'bill-9' } })) };
    router = { navigate: vi.fn() };
    toast = { success: vi.fn() };
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
        { provide: BillingService, useValue: billing },
        { provide: AuthService, useValue: { currentUserValue: { role } } },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toast },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => routeId },
              pathFromRoot: [{ paramMap: { get: (k: string) => (k === 'hospitalCode' ? 'sai-clinic' : null) } }],
            },
          },
        },
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
    expect(component.prescription!.patient.fullName).toBe('Rahul Sharma');
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

  describe('generating the bill', () => {
    it('is offered to an administrator', () => {
      expect(createComponent('rx-001', undefined, 'ADMIN').canGenerateBill).toBe(true);
    });

    it('is offered to a receptionist', () => {
      expect(createComponent('rx-001', undefined, 'RECEPTIONIST').canGenerateBill).toBe(true);
    });

    it('is not offered to a doctor, who the API would refuse', () => {
      expect(createComponent('rx-001', undefined, 'DOCTOR').canGenerateBill).toBe(false);
    });

    it('sends the amounts in paise and opens the new bill inside the clinic', () => {
      const component = createComponent();
      component.ngOnInit();
      component.additionalCharges = 50;
      component.discount = 10.5;
      component.tax = null;
      component.generateBill();

      expect(billing.createBill).toHaveBeenCalledWith('rx-001', {
        prescriptionId: 'rx-001',
        additionalChargesInPaisa: 5000,
        discountInPaisa: 1050,
        taxInPaisa: 0,
      });
      expect(toast.success).toHaveBeenCalledWith('Bill generated');
      expect(router.navigate).toHaveBeenCalledWith(['/', 'sai-clinic', 'billing', 'bill-9']);
    });

    it('refuses a negative amount without calling the server', () => {
      const component = createComponent();
      component.ngOnInit();
      component.discount = -1;
      component.generateBill();
      expect(billing.createBill).not.toHaveBeenCalled();
      expect(component.billError).toBe('Amounts cannot be negative.');
    });

    it('explains that a bill already exists when the server answers 409', () => {
      const component = createComponent();
      component.ngOnInit();
      billing.createBill.mockReturnValue(throwError(() => ({ status: 409 })));
      component.generateBill();
      expect(component.billError).toBe('A bill already exists for this prescription. Open it from Billing.');
      expect(component.isGeneratingBill).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('shows the server message for any other failure', () => {
      const component = createComponent();
      component.ngOnInit();
      billing.createBill.mockReturnValue(throwError(() => ({ status: 400, error: { message: 'Prescription has no items' } })));
      component.generateBill();
      expect(component.billError).toBe('Prescription has no items');
    });

    it('ignores a second click while the first request is running', () => {
      const component = createComponent();
      component.ngOnInit();
      component.isGeneratingBill = true;
      component.generateBill();
      expect(billing.createBill).not.toHaveBeenCalled();
    });
  });
});
