import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { PayoutService, StatementView } from '../../core/services/payout.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { formatMoney, toMinor } from '../../core/utils/money';
import { CurrencySymbolPipe } from '../../shared/pipes/money.pipe';

/** One payout statement: its lines, manual additions or deductions, TDS, then approve and pay. */
@Component({
  selector: 'app-payout-statement',
  standalone: true,
  imports: [CurrencySymbolPipe, FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Doctor payouts</a>
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      } @else if (s) {
        <div class="bg-white rounded-xl border border-outline-variant p-4 mb-3" id="statement-header">
          <div class="flex justify-between gap-2 flex-wrap">
            <h1 class="text-xl font-semibold">Dr {{ s.doctorName }} <span class="text-sm font-normal text-slate-600">{{ s.statementNumber }}</span></h1>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100" id="statement-status">{{ s.status.toLowerCase() }}</span>
          </div>
          <p class="text-sm text-slate-700">{{ s.periodFrom | date: 'd MMM y' }} to {{ s.periodTo | date: 'd MMM y' }}</p>
          @if (s.paidAt) { <p class="text-sm">Paid {{ s.paidAt | date: 'd MMM y' }} · {{ s.paymentMethod }}{{ s.paymentReference ? ' · ' + s.paymentReference : '' }}</p> }
          @if (s.cancelReason) { <p class="text-sm text-status-red">Cancelled: {{ s.cancelReason }}</p> }
        </div>

        <div class="grid grid-cols-3 gap-2 mb-3">
          <div class="rounded-xl p-3 bg-sky-600 text-white"><p class="text-xs opacity-90">Gross</p><p class="text-lg font-bold" id="statement-gross">{{ money(s.grossInPaisa) }}</p></div>
          <div class="rounded-xl p-3 bg-amber-600 text-white"><p class="text-xs opacity-90">TDS {{ s.tdsBasisPoints / 100 }}%</p><p class="text-lg font-bold">{{ money(s.tdsInPaisa) }}</p></div>
          <div class="rounded-xl p-3 bg-emerald-600 text-white"><p class="text-xs opacity-90">Net</p><p class="text-lg font-bold" id="statement-net">{{ money(s.netInPaisa) }}</p></div>
        </div>

        <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3 overflow-x-auto" id="statement-lines">
          <table class="w-full text-sm">
            @for (l of s.lines; track l.id) {
              <tr class="border-b border-dashed" [attr.data-line]="l.description">
                <td class="py-1.5 pr-2 whitespace-nowrap text-slate-600">{{ l.occurredOn | date: 'd MMM' }}</td>
                <td class="py-1.5 pr-2">{{ l.description }}<span class="block text-xs text-slate-500">{{ l.basis }}{{ l.baseInPaisa ? ' · fee ' + money(l.baseInPaisa) : '' }}</span></td>
                <td class="py-1.5 text-right font-semibold" [class.text-status-red]="l.amountInPaisa < 0">{{ money(l.amountInPaisa) }}</td>
                @if (isDraft) {
                  <td class="pl-2"><button type="button" (click)="run(payouts.removeLine(s.id, l.id), 'Line removed')" class="text-xs underline" [attr.aria-label]="'Remove ' + l.description">Remove</button></td>
                }
              </tr>
            } @empty {
              <tr><td class="py-2 text-slate-600">Nothing earned under the doctor's rules in this period. Add lines below if needed.</td></tr>
            }
          </table>
        </div>

        @if (isDraft) {
          <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3 space-y-2" id="statement-edit">
            <div class="flex gap-2 flex-wrap">
              <input [(ngModel)]="lineText" maxlength="255" id="line-text" aria-label="Line" placeholder="e.g. On-call allowance, advance recovered"
                class="flex-1 min-w-[200px] border border-outline-variant rounded-lg p-2 text-sm" />
              <input type="number" min="0" [(ngModel)]="lineAmount" id="line-amount" aria-label="Amount" placeholder="{{ 'home' | currencySymbol }}" class="w-28 border border-outline-variant rounded-lg p-2 text-sm" />
              <button type="button" (click)="deduct = !deduct" class="px-3 min-h-touch rounded-full text-sm border"
                [class]="deduct ? 'bg-red-600 text-white border-red-600' : 'bg-white border-outline-variant'">{{ deduct ? 'Deduction' : 'Addition' }}</button>
              <button type="button" id="add-line" (click)="addLine()" [disabled]="!lineText.trim() || !lineAmount"
                class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Add</button>
            </div>
            <div class="flex gap-2 items-center flex-wrap">
              <span class="text-sm">TDS:</span>
              @for (t of tdsChoices; track t) {
                <button type="button" (click)="run(payouts.setTds(s.id, t), 'TDS updated')" class="px-3 min-h-touch rounded-full text-sm border"
                  [class]="s.tdsBasisPoints === t ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-outline-variant'">{{ t / 100 }}%</button>
              }
            </div>
          </div>
        }

        <div class="flex gap-2 flex-wrap items-center" id="statement-actions">
          @if (isDraft) {
            <button type="button" id="statement-approve" (click)="run(payouts.approve(s.id), 'Approved')" class="act bg-blue-600">Approve</button>
          }
          @if (s.status === 'APPROVED') {
            @for (m of methods; track m.value) {
              <button type="button" (click)="method = m.value" class="px-3 min-h-touch rounded-full text-sm border"
                [class]="method === m.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-outline-variant'">{{ m.label }}</button>
            }
            <input [(ngModel)]="reference" maxlength="100" id="pay-reference" aria-label="Reference" placeholder="UTR / cheque no." class="border border-outline-variant rounded-lg p-2 text-sm" />
            <button type="button" id="statement-pay" (click)="run(payouts.pay(s.id, method, reference.trim() || null), 'Marked paid')" class="act bg-emerald-700">Mark paid</button>
          }
          <button type="button" id="statement-pdf" (click)="pdf()" class="act bg-slate-600">PDF</button>
          @if (s.status === 'DRAFT' || s.status === 'APPROVED') {
            <button type="button" (click)="cancel()" class="act bg-red-700">Cancel</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`.act { display: flex; align-items: center; gap: 0.25rem; padding: 0 1rem; min-height: 44px; border-radius: 0.5rem; color: white; font-size: 0.875rem; font-weight: 600; }`],
})
export class PayoutStatementComponent implements OnInit {
  readonly payouts = inject(PayoutService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  readonly tdsChoices = [0, 1000];
  readonly methods = [
    { value: 'BANK_TRANSFER', label: 'Bank transfer' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'CASH', label: 'Cash' },
  ];
  s: StatementView | null = null;
  error = '';
  busy = false;
  lineText = '';
  lineAmount: number | null = null;
  deduct = false;
  method = 'BANK_TRANSFER';
  reference = '';

  get isDraft(): boolean {
    return this.s?.status === 'DRAFT';
  }

  ngOnInit(): void {
    this.payouts.get(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: (s) => (this.s = s),
      error: (err) => (this.error = err?.error?.message || 'The statement could not be loaded.'),
    });
  }

  addLine(): void {
    const paisa = toMinor(this.lineAmount ?? 0) * (this.deduct ? -1 : 1);
    this.run(this.payouts.addLine(this.s!.id, this.lineText.trim(), paisa), 'Line added', () => {
      this.lineText = '';
      this.lineAmount = null;
      this.deduct = false;
    });
  }

  cancel(): void {
    const reason = window.prompt('Why cancel this statement?');
    if (!reason || !reason.trim()) return;
    this.run(this.payouts.cancel(this.s!.id, reason.trim()), 'Statement cancelled');
  }

  pdf(): void {
    this.payouts.pdf(this.s!.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toast.error('The PDF could not be opened.'),
    });
  }

  run(call: Observable<StatementView>, done: string, after?: () => void): void {
    if (this.busy) return;
    this.busy = true;
    call.subscribe({
      next: (s) => {
        this.busy = false;
        this.s = s;
        after?.();
        this.toast.success(done);
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'That did not work.');
      },
    });
  }

  money(paisa: number): string {
    return (paisa < 0 ? '−' : '') + formatMoney(Math.abs(paisa));
  }
}
