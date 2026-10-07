import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BillingService } from '../../../../core/services/billing.service';
import { Bill, amountDueInPaisa } from '../../../../core/models/billing.model';
import { AsyncPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentModal } from '../payment-modal/payment-modal';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { SettingService } from '../../../../core/services/setting.service';
import { ClinicProfile } from '../../../../core/models/setting.model';
import { mediaUrl } from '../../../../core/utils/media-url';
import { CurrencySymbolPipe, MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { fromMinor } from '../../../../core/utils/money';
import { CurrencyService } from '../../../../core/services/currency.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
  imports: [CurrencySymbolPipe, MoneyPipe, NgClass, DecimalPipe, DatePipe, AsyncPipe, FormsModule, PaymentModal, RouterLink],
})
export class InvoiceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private billingService = inject(BillingService);
  private toast = inject(ToastService);
  private settingService = inject(SettingService);
  private currencyService = inject(CurrencyService);
  private tenantContext = inject(TenantContextService);
  readonly currencies$ = this.currencyService.currencies();

  /** The clinic's own name, address and contact for the invoice. */
  clinic: ClinicProfile | null = null;

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
    return fromMinor(this.bill?.totalAmountInPaisa || 0);
  }

  /** Still owed, part-payments deducted: what the payment dialog collects. */
  get dueInPaisa(): number {
    return this.bill ? amountDueInPaisa(this.bill) : 0;
  }

  get due(): number {
    return fromMinor(this.dueInPaisa);
  }

  get paid(): number {
    return this.total - this.due;
  }

  get logoSrc(): string | null {
    return mediaUrl(this.clinic?.logoUrl);
  }

  get clinicContact(): string {
    const c = this.clinic;
    if (!c) return '';
    return [c.address, [c.phone, c.email].filter(Boolean).join('  |  ')].filter(Boolean).join('\n');
  }

  ngOnInit() {
    this.settingService.getProfile().subscribe({
      next: (res) => (this.clinic = res.data ?? null),
      error: () => (this.clinic = null),
    });
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
          this.billCurrency = this.bill?.foreign?.currency ?? '';
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

  /** Bill in another currency (module MULTI_CURRENCY): offered while nothing has been paid on it. */
  get canChangeCurrency(): boolean {
    return this.tenantContext.isModuleActive('MULTI_CURRENCY') && !!this.bill && !this.bill.isVoided
      && (this.bill.amountPaidInPaisa ?? 0) === 0;
  }

  billCurrency = '';

  setCurrency(code: string) {
    if (!this.bill) return;
    this.currencyService.setBillCurrency(this.bill.id, code).subscribe({
      next: (bill) => {
        this.bill = bill;
        this.billCurrency = bill.foreign?.currency ?? '';
        this.toast.success(bill.foreign ? `Shown in ${bill.foreign.currency}` : 'Shown in the clinic currency');
      },
      error: (err) => {
        this.billCurrency = this.bill?.foreign?.currency ?? '';
        this.toast.error(err?.error?.message || 'The currency could not be changed.');
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
