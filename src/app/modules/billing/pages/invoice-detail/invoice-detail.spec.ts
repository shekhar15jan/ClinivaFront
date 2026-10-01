import { TestBed } from '@angular/core/testing';
import { InvoiceDetail } from './invoice-detail';
import { BillingService } from '../../../../core/services/billing.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { SettingService } from '../../../../core/services/setting.service';

describe('InvoiceDetail', () => {
  const mockBill = {
    id: 'b-001', appointmentId: 'a1', patient: { id: 'p1', fullName: 'Rahul Sharma' },
    consultationFeeInPaisa: 50000,
    discountInPaisa: 0, taxInPaisa: 2500, totalAmountInPaisa: 52500,
    paymentStatus: 'UNPAID' as const, createdAt: '2026-07-01',
  };

  function createComponent(overrides?: Partial<BillingService>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BillingService,
          useValue: {
            getBillById: vi.fn().mockReturnValue(of({ success: true, data: mockBill })),
            updateBill: vi.fn().mockReturnValue(of({ success: true })),
            downloadPdf: vi.fn().mockReturnValue(of(new Blob([]))),
            ...overrides,
          },
        },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'b-001' } } } },
        { provide: SettingService, useValue: { getProfile: vi.fn().mockReturnValue(of({ success: true, data: {
          clinicName: 'Sai Clinic', address: '12 Lake Road, Pune', phone: '+91 2041234567', email: 'desk@saiclinic.in', logoUrl: null,
        } })) } },
      ],
    });
    return TestBed.runInInjectionContext(() => new InvoiceDetail());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.bill).toBeNull();
    expect(component.isLoading).toBe(false);
  });

  it('should load bill from route param on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.bill).toBeDefined();
    expect(component.bill?.paymentStatus).toBe('UNPAID');
  });

  it('should compute total from paisa', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.total).toBe(525);
  });

  it('should show correct status', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.status).toBe('UNPAID');
  });

  it('should call updateBill on collectPayment', () => {
    const updateSpy = vi.fn().mockReturnValue(of({ success: true }));
    const component = createComponent({ updateBill: updateSpy });
    component.ngOnInit();
    component.collectPayment();
  });

  it('should not collect payment if already paid', () => {
    const paidBill = { ...mockBill, paymentStatus: 'PAID' as const };
    const component = createComponent({
      getBillById: vi.fn().mockReturnValue(of({ success: true, data: paidBill })),
    });
    component.ngOnInit();
    expect(component.status).toBe('PAID');
  });

  it("shows the clinic's own name, address and contact (it showed a made-up address)", () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.clinic?.clinicName).toBe('Sai Clinic');
    expect(component.clinicContact).toBe('12 Lake Road, Pune\n+91 2041234567  |  desk@saiclinic.in');
  });
});
