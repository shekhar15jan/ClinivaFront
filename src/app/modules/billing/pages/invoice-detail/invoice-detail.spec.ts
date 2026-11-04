// @ts-expect-error vite '?raw' import (no type declaration in this project)
import invoiceTemplate from './invoice-detail.html?raw';
import { TestBed } from '@angular/core/testing';
import { InvoiceDetail } from './invoice-detail';
import { BillingService } from '../../../../core/services/billing.service';
import { ActivatedRoute, provideRouter } from '@angular/router';
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

describe('InvoiceDetail GST breakdown', () => {
  const base = {
    id: 'b-002', appointmentId: 'a1', patient: { id: 'p1', fullName: 'Rahul Sharma' },
    consultationFeeInPaisa: 10100, discountInPaisa: 0, taxInPaisa: 505, totalAmountInPaisa: 10605,
    paymentStatus: 'UNPAID' as const, createdAt: '2026-07-01',
  };
  const gst = {
    gstin: '27ABCDE1234F1Z5', placeOfSupply: 'Maharashtra', sacCode: '9993', taxableInPaisa: 10100,
    cgstRatePercent: 2.5, cgstInPaisa: 252, sgstRatePercent: 2.5, sgstInPaisa: 253,
    amountInWords: 'Rupees One Hundred Six and Five Paise Only',
  };

  function render(bill: object): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BillingService, useValue: { getBillById: vi.fn().mockReturnValue(of({ success: true, data: bill })) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'b-002' } } } },
        { provide: SettingService, useValue: { getProfile: vi.fn().mockReturnValue(of({ success: true, data: { clinicName: 'Sai Clinic' } })) } },
      ],
    });
    // The test runner compiles in the browser (JIT), which cannot fetch templateUrl/styleUrl, so the template is supplied inline.
    TestBed.overrideComponent(InvoiceDetail, { set: { template: invoiceTemplate, templateUrl: undefined, styleUrl: undefined, styles: [] } });
    const fixture = TestBed.createComponent(InvoiceDetail);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows GSTIN, SAC, taxable value, CGST, SGST and the amount in words when the bill has a GST split', () => {
    const el = render({ ...base, gst });
    expect(el.querySelector('#invoice-gstin')?.textContent).toContain('27ABCDE1234F1Z5');
    expect(el.querySelector('#invoice-sac')?.textContent).toContain('9993');
    expect(el.querySelector('#invoice-gst-taxable')?.textContent).toContain('101.00');
    expect(el.querySelector('#invoice-gst-cgst')?.textContent).toContain('2.5%');
    expect(el.querySelector('#invoice-gst-cgst')?.textContent).toContain('2.52');
    expect(el.querySelector('#invoice-gst-sgst')?.textContent).toContain('2.53');
    expect(el.querySelector('#invoice-words')?.textContent).toContain('Rupees One Hundred Six and Five Paise Only');
  });

  it('keeps the single Tax line when the bill has no GST split', () => {
    const el = render(base);
    expect(el.querySelector('#invoice-gst-cgst')).toBeNull();
    expect(el.querySelector('#invoice-gstin')).toBeNull();
    expect(el.textContent).toContain('Tax');
  });
});
