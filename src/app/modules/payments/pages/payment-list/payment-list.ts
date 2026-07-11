import { Component, OnInit, inject } from '@angular/core';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentResponse } from '../../../../core/models/payment.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, DatePipe],
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
