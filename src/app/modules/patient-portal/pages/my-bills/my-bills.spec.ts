import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MyBills } from './my-bills';
import { BillingService } from '../../../../core/services/billing.service';
import { RazorpayCheckoutService } from '../../../../core/services/razorpay-checkout.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Bill } from '../../../../core/models/billing.model';

describe('MyBills', () => {
  const partPaid = {
    id: 'b1', billNumber: 'BILL-2026-0001', totalAmountInPaisa: 50000, amountPaidInPaisa: 20000,
    paymentStatus: 'PARTIALLY_PAID', createdAt: '2026-09-01',
  } as Bill;
  const checkout = { isAvailable: vi.fn(), payBill: vi.fn() };
  const toast = { success: vi.fn(), error: vi.fn() };
  const billing = { getPatientBills: vi.fn(() => of({ success: true, data: [partPaid] })) };

  function create(): MyBills {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: BillingService, useValue: billing },
        { provide: RazorpayCheckoutService, useValue: checkout },
        { provide: ToastService, useValue: toast },
      ],
    });
    return TestBed.runInInjectionContext(() => new MyBills());
  }

  beforeEach(() => vi.clearAllMocks());

  it('shows only what is still owed on a part-paid bill', () => {
    const page = create();
    expect(page.due(partPaid)).toBe(30000);
    expect(page.due({ ...partPaid, paymentStatus: 'PAID' })).toBe(0);
  });

  it('pays the amount due and reloads the bills once paid', async () => {
    const page = create();
    checkout.payBill.mockResolvedValue('paid');
    await page.pay(partPaid);
    expect(checkout.payBill).toHaveBeenCalledWith('b1', 30000);
    expect(toast.success).toHaveBeenCalled();
    expect(billing.getPatientBills).toHaveBeenCalled();
    expect(page.payingId).toBeNull();
  });

  it('explains a failed start', async () => {
    const page = create();
    checkout.payBill.mockRejectedValue(new Error('Online payment is temporarily unavailable.'));
    await page.pay(partPaid);
    expect(toast.error).toHaveBeenCalledWith('Online payment is temporarily unavailable.');
  });
});
