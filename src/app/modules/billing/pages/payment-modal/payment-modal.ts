import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../../core/services/payment.service';

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

          @if (selectedMethod === 'UPI' && upiQrCode) {
            <div class="mb-4 text-center">
              <p class="text-sm text-gray-600 mb-2">Scan QR Code</p>
              <div class="bg-white border rounded-lg p-4 inline-block">
                <img [src]="upiQrCode" alt="UPI QR Code" class="w-40 h-40" />
              </div>
            </div>
          }

          @if (selectedMethod === 'UPI' && !upiQrCode && !loadingQr) {
            <button
              (click)="generateQr()"
              class="w-full mb-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <span class="material-symbols-outlined text-lg align-middle">qr_code</span>
              Generate UPI QR Code
            </button>
          }

          @if (loadingQr) {
            <div class="text-center py-3 mb-4">
              <div class="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p class="text-sm text-gray-500 mt-1">Generating QR...</p>
            </div>
          }

          <div class="flex justify-end gap-3 pt-4 border-t">
            <button
              (click)="onCancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50"
            >Cancel</button>
            <button
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
export class PaymentModal {
  private paymentService = inject(PaymentService);

  @Input() open = false;
  @Input() billId = '';
  @Input() amountInPaisa = 0;
  @Output() closed = new EventEmitter<void>();
  @Output() paymentSuccess = new EventEmitter<void>();

  paymentMethods: PaymentMethod[] = ['CASH', 'UPI', 'CARD', 'NET_BANKING'];
  methodLabels: Record<PaymentMethod, string> = {
    CASH: 'Cash',
    UPI: 'UPI / QR Code',
    CARD: 'Card',
    NET_BANKING: 'Net Banking',
  };

  selectedMethod: PaymentMethod = 'CASH';
  upiQrCode: string | null = null;
  loadingQr = false;
  isProcessing = false;
  error = '';

  generateQr() {
    if (!this.billId) return;
    this.loadingQr = true;
    this.paymentService.generateUpiQr(this.billId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.upiQrCode = res.data;
        }
        this.loadingQr = false;
      },
      error: () => {
        this.error = 'Failed to generate QR code';
        this.loadingQr = false;
      },
    });
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
          this.error = 'Payment failed. Please try again.';
        }
        this.isProcessing = false;
      },
      error: (err) => {
        this.error = err?.message || 'Payment processing error';
        this.isProcessing = false;
      },
    });
  }

  onCancel() {
    this.selectedMethod = 'CASH';
    this.upiQrCode = null;
    this.error = '';
    this.closed.emit();
  }
}
