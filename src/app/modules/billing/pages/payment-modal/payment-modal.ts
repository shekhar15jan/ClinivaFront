import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../../core/services/payment.service';
import { RazorpayCheckoutService } from '../../../../core/services/razorpay-checkout.service';

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING';

@Component({
  selector: 'app-payment-modal',
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="onCancel()" (keydown.escape)="onCancel()" tabindex="0" role="dialog" aria-modal="true">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()" tabindex="-1">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Collect Payment</h3>
            <button (click)="onCancel()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="mb-4 p-3 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600">Amount Due</p>
            <p class="text-2xl font-bold text-gray-900">₹{{ (amountInPaisa / 100).toFixed(2) }}</p>
          </div>

          <div class="mb-4">
            <p class="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
            <div class="grid grid-cols-2 gap-2">
              @for (method of paymentMethods; track method) {
                <button
                  (click)="selectedMethod = method"
                  [class.bg-blue-50]="selectedMethod === method"
                  [class.border-blue-500]="selectedMethod === method"
                  class="px-4 py-3 border rounded-lg text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  {{ methodLabels[method] }}
                </button>
              }
            </div>
          </div>

          @if (onlineAvailable) {
            <button
              id="payment-online"
              type="button"
              (click)="payOnline()"
              [disabled]="isProcessing"
              class="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 border border-blue-600 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              <span class="material-symbols-outlined text-[18px]">credit_card</span>
              Pay online now (card, UPI, net banking)
            </button>
            <p class="-mt-2 mb-4 text-xs text-gray-500">Opens Razorpay; the bill is marked paid as soon as the payment goes through.</p>
          }

          @if (selectedMethod !== 'CASH') {
            <p class="mb-4 text-xs text-gray-500" id="payment-note">
              Record this only once the money has reached the clinic. It is saved as received by {{ methodLabels[selectedMethod] }}.
            </p>
          }

          <div class="flex justify-end gap-3 pt-4 border-t">
            <button
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50"
            >Cancel</button>
            <button
              id="payment-confirm"
              (click)="onConfirm()"
              [disabled]="isProcessing"
              class="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ isProcessing ? 'Processing...' : (selectedMethod === 'CASH' ? 'Mark as Paid' : 'Confirm Payment') }}
            </button>
          </div>

          @if (error) {
            <p class="mt-3 text-sm text-red-600">{{ error }}</p>
          }
        </div>
      </div>
    }
  `,
  imports: [CommonModule, FormsModule],
})
export class PaymentModal implements OnChanges {
  private paymentService = inject(PaymentService);
  private checkout = inject(RazorpayCheckoutService);

  @Input() open = false;
  @Input() billId = '';
  @Input() amountInPaisa = 0;
  /** Filled in on the Razorpay form. */
  @Input() patientName = '';
  @Output() closed = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  paymentMethods: PaymentMethod[] = ['CASH', 'UPI', 'CARD', 'NET_BANKING'];
  methodLabels: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    UPI: 'UPI',
    CARD: 'Card',
    NET_BANKING: 'Net Banking',
  };

  selectedMethod: PaymentMethod = 'CASH';
  isProcessing = false;
  error = '';
  /** Shown only when the clinic has saved its own Razorpay keys. */
  onlineAvailable = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.checkout.isAvailable().then((ok) => (this.onlineAvailable = ok));
    }
  }

  /** Card, UPI or net banking through the clinic's Razorpay account, at the desk or on the patient's phone. */
  async payOnline(): Promise<void> {
    if (!this.billId || this.isProcessing) return;
    this.isProcessing = true;
    this.error = '';
    try {
      const result = await this.checkout.payBill(this.billId, this.amountInPaisa, { name: this.patientName || undefined });
      if (result === 'paid') {
        this.paymentSuccess.emit();
        this.onCancel();
      }
    } catch (e) {
      this.error = (e as Error).message;
    } finally {
      this.isProcessing = false;
    }
  }

  onConfirm() {
    if (!this.billId || this.isProcessing) return;
    this.isProcessing = true;
    this.error = '';

    const mode = this.selectedMethod === 'CASH' ? 'OFFLINE' : 'ONLINE';

    this.paymentService.savePayment({
      billId: this.billId,
      amountInPaisa: this.amountInPaisa,
      paymentMethod: this.selectedMethod,
      paymentMode: mode,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.paymentSuccess.emit();
          this.onCancel();
        } else {
          this.error = res.message || 'The payment could not be recorded.';
        }
        this.isProcessing = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'The payment could not be recorded.';
        this.isProcessing = false;
      },
    });
  }

  onCancel() {
    this.selectedMethod = 'CASH';
    this.error = '';
    this.closed.emit();
  }
}
