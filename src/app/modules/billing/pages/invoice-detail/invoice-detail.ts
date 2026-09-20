import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillingService } from '../../../../core/services/billing.service';
import { Bill } from '../../../../core/models/billing.model';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';
import { PaymentModal } from '../payment-modal/payment-modal';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  imports: [NgClass, DecimalPipe, DatePipe, PaymentModal],
})
export class InvoiceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private billingService = inject(BillingService);
  private toast = inject(ToastService);

  bill: Bill | null = null;
  isLoading = false;
  isDownloading = false;
  showPayment = false;

  get id(): string | null {
    return this.route.snapshot.paramMap.get('id');
  }

  get status(): string {
    return this.bill?.paymentStatus || 'UNPAID';
  }

  get total(): number {
    return (this.bill?.totalAmountInPaisa || 0) / 100;
  }

  ngOnInit() {
    if (this.id) {
      this.loadBill(this.id);
    }
  }

  loadBill(id: string) {
    this.isLoading = true;
    this.billingService.getBillById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.bill = res.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  /** Opens the payment dialog. The dialog records the payment on the server; nothing is marked paid here. */
  collectPayment() {
    if (this.status === 'PAID' || !this.id) return;
    this.showPayment = true;
  }

  /** Reads the bill again, so the badge shows what the server says rather than what the browser assumes. */
  onPaymentRecorded() {
    this.showPayment = false;
    this.toast.success('Payment recorded');
    if (this.id) this.loadBill(this.id);
  }

  printInvoice() {
    window.print();
  }

  downloadPdf() {
    if (!this.id || this.isDownloading) return;
    this.isDownloading = true;
    this.billingService.downloadPdf(this.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${this.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
      },
      error: (err) => {
        console.error('Invoice PDF download failed:', err);
        this.isDownloading = false;
      },
    });
  }
}
