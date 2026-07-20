import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentResponse } from '../../../../core/models/payment.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, DatePipe, FormsModule],
})
export class PaymentList implements OnInit {
  private paymentService = inject(PaymentService);

  payments: PaymentResponse[] = [];
  filteredPayments: PaymentResponse[] = [];
  isLoading = false;
  error = '';
  statusFilter = '';
  searchQuery = '';

  selectedPayment: PaymentResponse | null = null;

  showQrModal = false;
  qrBillId = '';
  qrCode = '';
  qrLoading = false;
  qrError = '';

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    this.error = '';
    this.paymentService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payments = res.data;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load payments';
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.payments];
    if (this.statusFilter) {
      result = result.filter((p) => p.paymentStatus === this.statusFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((p) => p.billId.toLowerCase().includes(q) || p.paymentMethod.toLowerCase().includes(q));
    }
    this.filteredPayments = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  get totalCollected(): number {
    return this.payments.filter((p) => p.paymentStatus === 'PAID').reduce((sum, p) => sum + p.amountInPaisa, 0);
  }

  get paidCount(): number {
    return this.payments.filter((p) => p.paymentStatus === 'PAID').length;
  }

  get pendingCount(): number {
    return this.payments.filter((p) => p.paymentStatus === 'PENDING' || p.paymentStatus === 'FAILED').length;
  }

  getAmount(amountInPaisa: number): string {
    return '₹' + (amountInPaisa / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  openDetail(payment: PaymentResponse): void {
    this.selectedPayment = payment;
  }

  closeDetail(): void {
    this.selectedPayment = null;
  }

  openUpiQr(): void {
    this.showQrModal = true;
    this.qrBillId = '';
    this.qrCode = '';
    this.qrError = '';
  }

  closeQrModal(): void {
    this.showQrModal = false;
    this.qrCode = '';
    this.qrError = '';
  }

  generateQr(): void {
    if (!this.qrBillId.trim()) {
      this.qrError = 'Please enter a bill ID';
      return;
    }
    this.qrLoading = true;
    this.qrError = '';
    this.qrCode = '';
    this.paymentService.generateUpiQr(this.qrBillId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.qrCode = res.data;
        } else {
          this.qrError = 'Failed to generate QR code';
        }
        this.qrLoading = false;
      },
      error: (err) => {
        this.qrError = err?.message || 'QR generation failed';
        this.qrLoading = false;
      },
    });
  }
}
