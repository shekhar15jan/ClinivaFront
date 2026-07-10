import { Component, OnInit, inject } from '@angular/core';
import { PaymentService } from '../../../core/services/payment.service';
import { PaymentResponse } from '../../../core/models/payment.model';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
  standalone: true,
  imports: [SharedModule],
})
export class PaymentList implements OnInit {
  private paymentService = inject(PaymentService);

  payments: PaymentResponse[] = [];
  isLoading = false;
  error = '';

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.isLoading = true;
    this.error = '';
    this.paymentService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payments = res.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load payments';
        this.isLoading = false;
      },
    });
  }

  getAmount(amountInPaisa: number): string {
    return '₹' + (amountInPaisa / 100).toFixed(2);
  }
}
