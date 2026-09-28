import { TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { PaymentModal } from './payment-modal';
import { PaymentService } from '../../../../core/services/payment.service';
import { RazorpayCheckoutService } from '../../../../core/services/razorpay-checkout.service';

describe('PaymentModal', () => {
  const checkout = { isAvailable: vi.fn(), payBill: vi.fn() };

  function create(): PaymentModal {
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentService, useValue: { savePayment: vi.fn(() => of({ success: true })) } },
        { provide: RazorpayCheckoutService, useValue: checkout },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PaymentModal());
    component.billId = 'bill-1';
    component.amountInPaisa = 30000;
    component.patientName = 'Asha Rao';
    return component;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    checkout.isAvailable.mockReset();
    checkout.payBill.mockReset();
  });

  it('should create', () => {
    expect(create()).toBeTruthy();
  });

  it('offers online payment only when the clinic takes it', async () => {
    const component = create();
    checkout.isAvailable.mockResolvedValue(true);
    component.open = true;
    component.ngOnChanges({ open: new SimpleChange(false, true, false) });
    await Promise.resolve();
    await Promise.resolve();
    expect(component.onlineAvailable).toBe(true);
  });

  it('charges what is due online and reports success once confirmed', async () => {
    const component = create();
    const done = vi.fn();
    component.paymentSuccess.subscribe(done);
    checkout.payBill.mockResolvedValue('paid');
    await component.payOnline();
    expect(checkout.payBill).toHaveBeenCalledWith('bill-1', 30000, { name: 'Asha Rao' });
    expect(done).toHaveBeenCalled();
  });

  it('closing the Razorpay window is not a payment', async () => {
    const component = create();
    const done = vi.fn();
    component.paymentSuccess.subscribe(done);
    checkout.payBill.mockResolvedValue('cancelled');
    await component.payOnline();
    expect(done).not.toHaveBeenCalled();
    expect(component.isProcessing).toBe(false);
  });

  it('shows why online payment could not start', async () => {
    const component = create();
    checkout.payBill.mockRejectedValue(new Error('Online payments are not set up for this clinic.'));
    await component.payOnline();
    expect(component.error).toContain('not set up');
  });
});
