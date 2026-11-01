import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { BillingPlanService } from '../../../../core/services/billing-plan.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { PlanPage } from './plan-page';

const overview = (extra: object = {}) => ({
  success: true,
  data: {
    productCode: 'CLINIVA', planCode: 'BASIC', planName: 'Basic', price: 999, currency: 'INR', cycle: 'MONTHLY', status: 'ACTIVE',
    startDate: '2026-10-01', endDate: '2026-11-20', renewalDate: '2026-11-20', daysLeft: 19, paymentAvailable: true,
    pendingInvoice: null, invoices: [], ...extra,
  },
});
const plans = {
  success: true,
  data: [
    { productCode: 'CLINIVA', code: 'BASIC', name: 'Basic', description: '', price: 999, currency: 'INR', cycle: 'MONTHLY', features: ['Up to 1 doctor'], popular: false },
    { productCode: 'CLINIVA', code: 'PRO', name: 'Pro', description: '', price: 2499, currency: 'INR', cycle: 'MONTHLY', features: [], popular: true },
  ],
};

describe('PlanPage', () => {
  let fixture: ComponentFixture<PlanPage>;
  let svc: { overview: ReturnType<typeof vi.fn>; plans: ReturnType<typeof vi.fn>; checkout: ReturnType<typeof vi.fn>; invoice: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  const el = () => fixture.nativeElement as HTMLElement;

  function open(ov: { data: unknown } = overview()): void {
    svc.overview.mockReturnValue(of(ov.data));
    fixture = TestBed.createComponent(PlanPage);
    fixture.detectChanges();
  }

  beforeEach(() => {
    svc = { overview: vi.fn(), plans: vi.fn().mockReturnValue(of(plans.data)), checkout: vi.fn(), invoice: vi.fn() };
    toast = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [PlanPage],
      providers: [{ provide: BillingPlanService, useValue: svc }, { provide: ToastService, useValue: toast }],
    });
  });

  afterEach(() => fixture?.destroy());

  it('shows plan, price, end date and renewal date', () => {
    open();
    expect(el().querySelector('#plan-name')?.textContent).toContain('Basic');
    expect(el().querySelector('#plan-price')?.textContent).toContain('999');
    expect(el().querySelector('#plan-end')?.textContent).toContain('20 Nov 2026');
    expect(el().querySelector('#plan-renewal')?.textContent).toContain('20 Nov 2026');
    expect(el().querySelector('#plan-no-invoices')).toBeTruthy();
  });

  it('lists the invoices with their state', () => {
    open(overview({ invoices: [{ id: '1', invoiceNumber: 'CSI-1', totalPaise: 99900, status: 'PAID', createdAt: '2026-10-01T10:00:00', downloadUrl: 'https://x.test/a.pdf', paymentLinkUrl: null }] }));
    const row = el().querySelector('[data-invoice="CSI-1"]')!;
    expect(row.textContent).toContain('Paid');
    expect(row.textContent).toContain('999');
    expect(row.querySelector('a')?.getAttribute('href')).toBe('https://x.test/a.pdf');
  });

  it('shows one tile per published plan, and Pay appears only after choosing one', () => {
    open();
    expect(el().querySelectorAll('#plan-tiles button').length).toBe(2);
    expect(el().querySelector('#plan-pay')).toBeNull();
    (el().querySelector('[data-plan="PRO"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('#plan-pay-bar')?.textContent).toContain('Change to');
    expect(el().querySelector('#plan-pay-bar')?.textContent).toContain('2,499');
  });

  it('Pay asks for a checkout, opens the payment link in a new tab and then shows the pending state', () => {
    open();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    svc.checkout.mockReturnValue(of({ paymentLinkUrl: 'https://rzp.test/l/1', invoice: {} }));
    (el().querySelector('[data-plan="BASIC"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('#plan-pay-bar')?.textContent).toContain('Renew');
    svc.overview.mockReturnValue(of(overview({ pendingInvoice: { id: '9', invoiceNumber: 'CSI-9', totalPaise: 99900, status: 'OPEN', paymentLinkUrl: 'https://rzp.test/l/1', createdAt: '2026-11-01T10:00:00' } }).data));
    (el().querySelector('#plan-pay') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(svc.checkout).toHaveBeenCalledWith('BASIC');
    expect(opened).toHaveBeenCalledWith('https://rzp.test/l/1', '_blank', 'noopener');
    expect(el().querySelector('#plan-pending')?.textContent).toContain('CSI-9');
    opened.mockRestore();
  });

  it('a checkout that fails tells the owner and opens nothing', () => {
    open();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);
    svc.checkout.mockReturnValue(throwError(() => ({ error: { message: 'Online payment is not set up yet.' } })));
    (el().querySelector('[data-plan="BASIC"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (el().querySelector('#plan-pay') as HTMLButtonElement).click();
    expect(toast.error).toHaveBeenCalledWith('Online payment is not set up yet.');
    expect(opened).not.toHaveBeenCalled();
    opened.mockRestore();
  });

  it('after the payment arrives the pending bar goes and the paid notice shows the new end date', () => {
    open(overview({ pendingInvoice: { id: '9', invoiceNumber: 'CSI-9', totalPaise: 99900, status: 'OPEN', paymentLinkUrl: 'u', createdAt: '2026-11-01T10:00:00' } }));
    expect(el().querySelector('#plan-pending')).toBeTruthy();
    svc.overview.mockReturnValue(of(overview({ endDate: '2026-12-20', invoices: [{ id: '9', invoiceNumber: 'CSI-9', totalPaise: 99900, status: 'PAID', createdAt: '2026-11-01T10:00:00' }] }).data));
    (el().querySelector('#plan-refresh') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el().querySelector('#plan-pending')).toBeNull();
    expect(el().querySelector('#plan-paid')?.textContent).toContain('20 Dec 2026');
  });

  it('says plainly when the platform cannot be reached', () => {
    svc.overview.mockReturnValue(throwError(() => ({ error: { message: 'Plan and billing cannot be reached right now.' } })));
    fixture = TestBed.createComponent(PlanPage);
    fixture.detectChanges();
    expect(el().querySelector('#plan-error')?.textContent).toContain('cannot be reached');
  });
});
