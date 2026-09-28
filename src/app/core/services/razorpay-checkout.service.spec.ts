import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RazorpayCheckoutService } from './razorpay-checkout.service';
import { PaymentService } from './payment.service';

interface CheckoutOptions {
  key: string;
  order_id: string;
  name: string;
  handler: (response: Record<string, string>) => void;
  modal: { ondismiss: () => void };
}
type TestWindow = Window & { Razorpay?: unknown };

describe('RazorpayCheckoutService', () => {
  const payments = { createOrder: vi.fn(), verifyPayment: vi.fn(), onlineAvailable: vi.fn() };
  let options: CheckoutOptions;
  const open = vi.fn();

  function create(): RazorpayCheckoutService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PaymentService, useValue: payments }] });
    return TestBed.inject(RazorpayCheckoutService);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (window as TestWindow).Razorpay = class {
      constructor(o: CheckoutOptions) { options = o; }
      open = open;
      on = vi.fn();
    };
    payments.createOrder.mockReturnValue(of({
      success: true,
      data: { razorpayOrderId: 'order_1', razorpayKeyId: 'rzp_test_Clinic', amountInPaisa: 30000, currency: 'INR',
        billId: 'b1', clinicName: 'City Clinic', billNumber: 'BILL-1' },
    }));
  });

  afterEach(() => delete (window as TestWindow).Razorpay);

  it("opens checkout with the clinic's own key and confirms the payment with the server", async () => {
    payments.verifyPayment.mockReturnValue(of({ success: true }));
    const result = create().payBill('b1', 30000, { name: 'Asha' });
    await vi.waitFor(() => expect(open).toHaveBeenCalled());
    expect(options.key).toBe('rzp_test_Clinic');
    expect(options.order_id).toBe('order_1');
    expect(options.name).toBe('City Clinic');
    options.handler({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' });
    await expect(result).resolves.toBe('paid');
    expect(payments.verifyPayment).toHaveBeenCalledWith(
      { razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: 'sig' });
  });

  it('closing the window resolves as cancelled', async () => {
    const result = create().payBill('b1', 30000);
    await vi.waitFor(() => expect(open).toHaveBeenCalled());
    options.modal.ondismiss();
    await expect(result).resolves.toBe('cancelled');
  });

  it("passes on the server's reason when checkout cannot start", async () => {
    payments.createOrder.mockReturnValue(throwError(() => ({ error: { message: 'Online payments are not set up for this clinic.' } })));
    await expect(create().payBill('b1', 30000)).rejects.toThrow('not set up');
    expect(open).not.toHaveBeenCalled();
  });

  it('a rejected signature is reported, not treated as paid', async () => {
    payments.verifyPayment.mockReturnValue(throwError(() => ({ error: { message: 'Payment signature verification failed' } })));
    const result = create().payBill('b1', 30000);
    await vi.waitFor(() => expect(open).toHaveBeenCalled());
    options.handler({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'bad' });
    await expect(result).rejects.toThrow('verification failed');
  });

  it('is unavailable when the check fails', async () => {
    payments.onlineAvailable.mockReturnValue(throwError(() => new Error('offline')));
    await expect(create().isAvailable()).resolves.toBe(false);
    payments.onlineAvailable.mockReturnValue(of({ success: true, data: { available: true } }));
    await expect(create().isAvailable()).resolves.toBe(true);
  });
});
