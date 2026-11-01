import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { BillingPlanService, PlanInvoice, PlanOverview, PublishedPlan } from '../../../../core/services/billing-plan.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

const TILE_COLOURS = ['bg-indigo-600', 'bg-teal-600', 'bg-rose-600', 'bg-amber-600', 'bg-sky-600'];

/**
 * Settings, Plan: what the clinic is on (plan, price, end date, renewal date), its invoices, and Renew or change plan:
 * tap a plan tile, see the price, press Pay (the payment page opens in a new tab), then the screen shows pending until
 * the payment arrives and the end date moves.
 */
@Component({
  selector: 'app-plan-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">Plan and billing</h1>
      @if (error) {
        <div id="plan-error" class="rounded-xl p-3 my-3 text-sm bg-amber-50 text-amber-900">{{ error }}</div>
      }
      @if (o) {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3" id="plan-summary">
          <div class="rounded-xl p-3 bg-indigo-600 text-white"><p class="text-xs opacity-90">Plan</p><p class="text-lg font-bold" id="plan-name">{{ o.planName || 'None' }}</p></div>
          <div class="rounded-xl p-3 bg-teal-600 text-white"><p class="text-xs opacity-90">Price</p>
            <p class="text-lg font-bold" id="plan-price">{{ o.price !== null ? ('₹' + (o.price | number:'1.0-2')) : '-' }}@if (o.cycle) { <span class="text-xs font-normal"> / {{ cycleWord(o.cycle) }}</span> }</p></div>
          <div class="rounded-xl p-3 text-white" [class]="(o.daysLeft !== null && o.daysLeft < 8) ? 'bg-rose-600' : 'bg-sky-600'"><p class="text-xs opacity-90">Ends on</p>
            <p class="text-lg font-bold" id="plan-end">{{ o.endDate ? (o.endDate | date:'d MMM y') : 'No end date' }}</p></div>
          <div class="rounded-xl p-3 bg-amber-600 text-white"><p class="text-xs opacity-90">Renews on</p>
            <p class="text-lg font-bold" id="plan-renewal">{{ o.renewalDate ? (o.renewalDate | date:'d MMM y') : '-' }}</p></div>
        </div>

        @if (pending) {
          <div class="rounded-xl p-3 mb-3 text-sm bg-sky-50 text-sky-900 flex items-center gap-3 flex-wrap" id="plan-pending">
            <span class="flex-1">Waiting for your payment of ₹{{ pending.totalPaise / 100 | number:'1.0-2' }} (invoice {{ pending.invoiceNumber }}). This page updates by itself once it arrives.</span>
            @if (pending.paymentLinkUrl) {
              <a [href]="pending.paymentLinkUrl" target="_blank" rel="noopener" class="px-4 min-h-touch inline-flex items-center rounded-lg bg-primary text-white font-semibold">Open payment page</a>
            }
            <button type="button" id="plan-refresh" (click)="load()" class="px-4 min-h-touch rounded-lg border border-sky-300">I have paid: refresh</button>
          </div>
        }
        @if (paidNotice) {
          <div id="plan-paid" class="rounded-xl p-3 mb-3 text-sm bg-emerald-50 text-emerald-900">Payment received. Your plan now runs until {{ o.endDate | date:'d MMM y' }}.</div>
        }

        <h2 class="font-semibold mt-4 mb-2">Renew or change plan</h2>
        @if (!plans.length) {
          <p class="text-sm text-slate-600">No plans are published right now.</p>
        }
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="plan-tiles">
          @for (p of plans; track p.code; let i = $index) {
            <button type="button" [attr.data-plan]="p.code" (click)="choose(p)"
                    class="text-left rounded-2xl p-4 min-h-[8rem] text-white shadow focus:outline-none focus:ring-4 ring-offset-2"
                    [class]="tileColour(i) + (chosen?.code === p.code ? ' ring-4 ring-slate-900' : '')">
              <span class="block text-lg font-bold">{{ p.name }}@if (p.code === o.planCode) { <span class="text-xs font-normal"> (current)</span> }</span>
              <span class="block text-2xl font-extrabold mt-1">₹{{ p.price | number:'1.0-2' }}<span class="text-xs font-normal"> / {{ cycleWord(p.cycle) }}</span></span>
              @for (f of p.features.slice(0, 3); track f) { <span class="block text-xs opacity-90 mt-1">{{ f }}</span> }
            </button>
          }
        </div>
        @if (chosen) {
          <div class="sticky bottom-2 mt-3 rounded-xl bg-white border border-outline-variant p-3 flex items-center gap-3 flex-wrap shadow" id="plan-pay-bar">
            <span class="flex-1 text-sm">{{ chosen.code === o.planCode ? 'Renew' : 'Change to' }} <b>{{ chosen.name }}</b>: pay <b>₹{{ chosen.price | number:'1.0-2' }}</b> for one {{ cycleWord(chosen.cycle) }}.</span>
            <button type="button" id="plan-pay" [disabled]="paying" (click)="pay()" class="px-6 min-h-touch rounded-lg bg-emerald-600 text-white font-bold disabled:opacity-60">{{ paying ? 'Please wait...' : 'Pay' }}</button>
          </div>
        }

        <h2 class="font-semibold mt-6 mb-2">Invoices</h2>
        @if (!o.invoices.length) {
          <p class="text-sm text-slate-600" id="plan-no-invoices">No invoices yet.</p>
        } @else {
          <div class="bg-white rounded-xl border border-outline-variant divide-y" id="plan-invoices">
            @for (i of o.invoices; track i.id) {
              <div class="p-3 flex items-center gap-3 flex-wrap text-sm" [attr.data-invoice]="i.invoiceNumber">
                <span class="font-medium">{{ i.invoiceNumber }}</span>
                <span class="text-slate-600">{{ i.createdAt | date:'d MMM y' }}</span>
                <span class="flex-1">₹{{ i.totalPaise / 100 | number:'1.0-2' }}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="statusClass(i)">{{ statusWord(i) }}</span>
                @if (i.downloadUrl) { <a [href]="i.downloadUrl" target="_blank" rel="noopener" class="text-primary underline">Download</a> }
                @if (i.status === 'OPEN' && i.paymentLinkUrl) { <a [href]="i.paymentLinkUrl" target="_blank" rel="noopener" class="text-primary underline">Pay</a> }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class PlanPage implements OnInit, OnDestroy {
  private svc = inject(BillingPlanService);
  private toast = inject(ToastService);

  o: PlanOverview | null = null;
  plans: PublishedPlan[] = [];
  chosen: PublishedPlan | null = null;
  paying = false;
  paidNotice = false;
  error = '';
  pending: PlanInvoice | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.load();
    this.svc.plans().subscribe({ next: (p) => (this.plans = p), error: () => (this.plans = []) });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  load(): void {
    this.svc.overview().subscribe({
      next: (o) => {
        const wasPending = !!this.pending;
        this.o = o;
        this.error = '';
        this.pending = o.pendingInvoice;
        if (wasPending && !o.pendingInvoice && o.invoices[0]?.status === 'PAID') {
          this.paidNotice = true;
        }
        if (this.pending) this.startPolling(); else this.stopPolling();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Your plan could not be loaded. Please try again in a minute.';
      },
    });
  }

  choose(p: PublishedPlan): void {
    this.chosen = p;
  }

  pay(): void {
    if (!this.chosen || this.paying) return;
    this.paying = true;
    this.svc.checkout(this.chosen.code).subscribe({
      next: (c) => {
        this.paying = false;
        this.paidNotice = false;
        window.open(c.paymentLinkUrl, '_blank', 'noopener');
        this.load();
      },
      error: (err) => {
        this.paying = false;
        this.toast.error(err?.error?.message || 'The payment page could not be opened. Please try again.');
      },
    });
  }

  cycleWord(c: string): string {
    return ({ MONTHLY: 'month', QUARTERLY: '3 months', HALF_YEARLY: '6 months', YEARLY: 'year' } as Record<string, string>)[c.toUpperCase()] ?? c.toLowerCase();
  }

  tileColour(i: number): string {
    return TILE_COLOURS[i % TILE_COLOURS.length];
  }

  statusWord(i: PlanInvoice): string {
    return ({ OPEN: 'Waiting for payment', PAID: 'Paid', EXPIRED: 'Link expired', CANCELLED: 'Cancelled' } as Record<string, string>)[i.status] ?? i.status;
  }

  statusClass(i: PlanInvoice): string {
    return i.status === 'PAID' ? 'bg-emerald-100 text-emerald-900' : i.status === 'OPEN' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200 text-slate-800';
  }

  private startPolling(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.load(), 10000);
  }

  private stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
