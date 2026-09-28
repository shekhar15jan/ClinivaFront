import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from './payment.service';

/** The parts of Razorpay's checkout.js that are used here. */
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
  on(event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void): void;
}
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

export type CheckoutResult = 'paid' | 'cancelled';

export interface CheckoutPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Online payment of a bill with Razorpay checkout (FR-PAY-06), into the clinic's own Razorpay account:
 * the server creates the order with the clinic's keys, the patient pays in Razorpay's window, and the server
 * checks Razorpay's signature before the bill is marked paid. Razorpay's webhook confirms it as well, so a
 * payment still counts if the window is closed before it reports back.
 */
@Injectable({ providedIn: 'root' })
export class RazorpayCheckoutService {
  private paymentService = inject(PaymentService);
  private document = inject(DOCUMENT);
  private script?: Promise<RazorpayConstructor>;

  /** Whether the signed-in clinic takes online payments. Errors count as "no": the button is simply not shown. */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.paymentService.onlineAvailable());
      return !!res.data?.available;
    } catch {
      return false;
    }
  }

  /**
   * Opens checkout for what is still due on the bill. Resolves 'paid' once the server has confirmed the payment,
   * or 'cancelled' if the window was closed. Rejects with a message the screen can show.
   */
  async payBill(billId: string, amountDueInPaisa: number, prefill: CheckoutPrefill = {}): Promise<CheckoutResult> {
    const orderRes = await firstValueFrom(this.paymentService.createOrder({ billId, amountInPaisa: amountDueInPaisa }))
      .catch((err) => { throw new Error(err?.error?.message || 'Online payment could not be started.'); });
    const order = orderRes.data;
    if (!orderRes.success || !order) {
      throw new Error(orderRes.message || 'Online payment could not be started.');
    }
    const Razorpay = await this.load();

    return new Promise<CheckoutResult>((resolve, reject) => {
      const checkout = new Razorpay({
        key: order.razorpayKeyId,
        order_id: order.razorpayOrderId,
        amount: order.amountInPaisa,
        currency: order.currency || 'INR',
        name: order.clinicName || 'Clinic',
        description: order.billNumber ? `Bill ${order.billNumber}` : 'Bill payment',
        prefill,
        theme: { color: '#0052CC' },
        handler: (response: RazorpayResponse) => {
          this.paymentService.verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }).subscribe({
            next: (res) => res.success ? resolve('paid')
              : reject(new Error(res.message || 'The payment could not be confirmed.')),
            error: (err) => reject(new Error(err?.error?.message
              || 'The payment could not be confirmed yet. If money was taken, it will show as paid shortly.')),
          });
        },
        modal: { ondismiss: () => resolve('cancelled') },
      });
      // A failed attempt keeps the window open so the patient can try another way; nothing to do here.
      checkout.on('payment.failed', () => undefined);
      checkout.open();
    });
  }

  /** Loads checkout.js once, on first use, so screens that never take online payments do not fetch it. */
  private load(): Promise<RazorpayConstructor> {
    const win = this.document.defaultView as (Window & { Razorpay?: RazorpayConstructor }) | null;
    if (win?.Razorpay) return Promise.resolve(win.Razorpay);
    this.script ??= new Promise<RazorpayConstructor>((resolve, reject) => {
      const el = this.document.createElement('script');
      el.src = CHECKOUT_SRC;
      el.async = true;
      el.onload = () => win?.Razorpay ? resolve(win.Razorpay)
        : reject(new Error('Online payment could not be loaded. Please try again.'));
      el.onerror = () => {
        this.script = undefined;
        reject(new Error('Online payment could not be loaded. Check your connection and try again.'));
      };
      this.document.body.appendChild(el);
    });
    return this.script;
  }
}
