import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillingService } from '../../../../core/services/billing.service';
import { Bill } from '../../../../core/models/billing.model';
import { NgClass, DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  imports: [NgClass, DecimalPipe, DatePipe],
})
export class InvoiceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private billingService = inject(BillingService);

  bill: Bill | null = null;
  isLoading = false;
  isDownloading = false;
  isCollecting = false;

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

  collectPayment() {
    if (this.status === 'PAID' || !this.id) return;
    this.isCollecting = true;
    this.billingService.updateBill(this.id, {}).subscribe({
      next: () => {
        if (this.bill) {
          this.bill = { ...this.bill, paymentStatus: 'PAID' };
        }
        this.isCollecting = false;
      },
      error: () => {
        this.isCollecting = false;
      },
    });
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
