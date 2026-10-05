import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PayoutService, StatementSummary } from '../../core/services/payout.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/** A doctor's own payout statements, once approved, each as a PDF. Made for a phone. */
@Component({
  selector: 'app-my-payouts',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl">
      <h1 class="text-2xl font-semibold text-on-surface">My payouts</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Statements the hospital has approved for you.</p>
      <div class="space-y-2" id="my-payouts">
        @for (s of rows; track s.id) {
          <button type="button" (click)="open(s)" class="w-full text-left bg-white rounded-xl border border-outline-variant p-3 border-l-4"
            [style.border-left-color]="s.status === 'PAID' ? '#059669' : '#2563eb'" [attr.data-statement]="s.statementNumber">
            <div class="flex justify-between gap-2">
              <p class="font-semibold">{{ s.periodFrom | date: 'd MMM' }} – {{ s.periodTo | date: 'd MMM y' }}</p>
              <b>{{ money(s.netInPaisa) }}</b>
            </div>
            <p class="text-xs text-slate-600">{{ s.statementNumber }} · {{ s.status === 'PAID' ? 'paid' : 'approved, to be paid' }}</p>
          </button>
        } @empty {
          <p class="text-sm text-slate-600 bg-white rounded-xl border border-dashed border-outline-variant p-6 text-center" id="my-payouts-empty">No statements yet.</p>
        }
      </div>
    </div>
  `,
})
export class MyPayoutsComponent implements OnInit {
  private payouts = inject(PayoutService);
  private toast = inject(ToastService);

  rows: StatementSummary[] = [];

  ngOnInit(): void {
    this.payouts.mine().subscribe({ next: (p) => (this.rows = p.content) });
  }

  open(s: StatementSummary): void {
    this.payouts.minePdf(s.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toast.error('The statement could not be opened.'),
    });
  }

  money(paisa: number): string {
    return '₹' + (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
}
