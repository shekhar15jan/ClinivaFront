import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentResponse, PaymentSummary } from '../../../../core/models/payment.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { formatMoney } from '../../../../core/utils/money';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, DatePipe, FormsModule],
})
export class PaymentList implements OnInit, OnDestroy {
  private paymentService = inject(PaymentService);

  /** One page; status, search and paging run on the server. It used to load the last 200 and filter those. */
  payments: PaymentResponse[] = [];
  page = 0;
  totalPages = 1;
  totalElements = 0;
  /** Totals over the whole clinic, not just this page. */
  summary: PaymentSummary | null = null;
  isLoading = false;
  error = '';
  statusFilter = '';
  searchQuery = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  selectedPayment: PaymentResponse | null = null;

  ngOnInit(): void {
    this.loadPayments();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  loadPayments(page = this.page): void {
    this.isLoading = true;
    this.error = '';
    this.paymentService.getPage({ page, size: 20, status: this.statusFilter, q: this.searchQuery }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.payments = res.data.content;
          this.page = res.data.pageNumber;
          this.totalPages = Math.max(1, res.data.totalPages);
          this.totalElements = res.data.totalElements;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load payments';
        this.isLoading = false;
      },
    });
    this.paymentService.getSummary().subscribe({
      next: (res) => { if (res.success && res.data) this.summary = res.data; },
      error: () => undefined,
    });
  }

  /** A new status starts again from the first page. */
  onFilterChange(): void {
    this.loadPayments(0);
  }

  /** Searches once typing pauses. */
  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadPayments(0), 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) return;
    this.loadPayments(page);
  }

  statusLabel(status: string): string {
    return status === 'SUCCESS' ? 'Received' : status.charAt(0) + status.slice(1).toLowerCase();
  }

  getAmount(amountInPaisa: number): string {
    return formatMoney(amountInPaisa, undefined, { fixed: true });
  }

  openDetail(payment: PaymentResponse): void {
    this.selectedPayment = payment;
  }

  closeDetail(): void {
    this.selectedPayment = null;
  }
}
