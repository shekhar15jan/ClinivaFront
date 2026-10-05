import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DoctorRules, PAYOUT_SOURCES, PayoutMode, PayoutService, PayoutSource, StatementStatus, StatementSummary } from '../../core/services/payout.service';
import { ToastService } from '../../shared/components/toast/toast.service';

interface RuleDraft {
  mode: PayoutMode | 'NONE';
  value: number | null;
}

const STATUSES: { value: StatementStatus | ''; label: string }[] = [
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'APPROVED', label: 'To pay' },
  { value: 'PAID', label: 'Paid' },
  { value: '', label: 'All' },
];

/**
 * Doctor payouts for the accountant: each doctor's rules (a share of the fee, a fixed amount per item, or nothing),
 * and statements: draft one for a doctor and period in a few taps, then add manual lines, approve and pay.
 */
@Component({
  selector: 'app-payouts-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <h1 class="text-2xl font-semibold text-on-surface">Doctor payouts</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Statements from each doctor's rules: paid consultations, inpatient visits and surgeries, plus anything you add.</p>
      <div class="flex gap-2 mb-3" id="payout-tabs">
        <button type="button" (click)="tab = 'statements'" class="px-4 min-h-touch rounded-full text-sm border"
          [class]="tab === 'statements' ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">Statements</button>
        <button type="button" id="tab-rules" (click)="showRules()" class="px-4 min-h-touch rounded-full text-sm border"
          [class]="tab === 'rules' ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">Rules</button>
      </div>

      @if (tab === 'statements') {
        <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3" id="payout-generate">
          <p class="text-sm font-semibold mb-2">New statement</p>
          <div class="flex gap-2 flex-wrap items-center">
            <select [(ngModel)]="doctorId" id="payout-doctor" aria-label="Doctor" class="border border-outline-variant rounded-lg p-2 text-sm">
              <option value="">Doctor</option>
              @for (d of doctors; track d.doctorId) { <option [value]="d.doctorId">Dr {{ d.doctorName }}</option> }
            </select>
            <button type="button" (click)="lastMonth()" class="px-3 min-h-touch rounded-full text-sm border bg-white border-outline-variant">Last month</button>
            <button type="button" (click)="thisMonth()" class="px-3 min-h-touch rounded-full text-sm border bg-white border-outline-variant">This month so far</button>
            <input type="date" [(ngModel)]="from" id="payout-from" aria-label="From" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <input type="date" [(ngModel)]="to" id="payout-to" aria-label="To" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <button type="button" id="payout-make" (click)="generate()" [disabled]="busy || !doctorId || !from || !to"
              class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Draft statement</button>
          </div>
        </div>
        <div class="flex gap-2 flex-wrap items-center mb-3">
          @for (s of statuses; track s.value) {
            <button type="button" (click)="setStatus(s.value)" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="status === s.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-outline-variant'">{{ s.label }}</button>
          }
          <button type="button" id="payout-export" (click)="exportCsv()" [disabled]="!from || !to"
            class="ml-auto px-3 min-h-touch rounded-lg text-sm border border-outline-variant bg-white disabled:opacity-50">Export CSV for the period</button>
        </div>
        <div class="space-y-2" id="payout-statements">
          @for (s of rows; track s.id) {
            <a [routerLink]="[s.id]" class="block bg-white rounded-xl border border-outline-variant p-3 border-l-4" [attr.data-statement]="s.statementNumber"
              [style.border-left-color]="colour(s.status)">
              <div class="flex justify-between gap-2 flex-wrap">
                <p class="font-semibold">Dr {{ s.doctorName }} <span class="text-sm font-normal text-slate-600">{{ s.statementNumber }}</span></p>
                <b>{{ money(s.netInPaisa) }}</b>
              </div>
              <p class="text-xs text-slate-600">{{ s.periodFrom | date: 'd MMM' }} – {{ s.periodTo | date: 'd MMM y' }} · {{ s.status.toLowerCase() }}</p>
            </a>
          } @empty {
            <p class="text-sm text-slate-600 bg-white rounded-xl border border-dashed border-outline-variant p-6 text-center">No statements here.</p>
          }
        </div>
      } @else {
        <div class="space-y-3" id="payout-rules">
          @for (d of doctors; track d.doctorId) {
            <section class="bg-white rounded-xl border border-outline-variant p-3" [attr.data-doctor]="d.doctorName">
              <div class="flex justify-between items-center gap-2 flex-wrap">
                <h2 class="font-semibold">Dr {{ d.doctorName }}</h2>
                <p class="text-xs text-slate-600">{{ summary(d) }}</p>
              </div>
              @if (editing === d.doctorId) {
                @for (src of sources; track src.value) {
                  <div class="flex gap-2 items-center flex-wrap py-1" [attr.data-source]="src.value">
                    <span class="text-sm w-48">{{ src.label }}</span>
                    @for (m of modes; track m.value) {
                      <button type="button" (click)="draft[src.value].mode = m.value" class="px-3 min-h-touch rounded-full text-xs border"
                        [class]="draft[src.value].mode === m.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-outline-variant'">{{ m.label }}</button>
                    }
                    @if (draft[src.value].mode !== 'NONE') {
                      <input type="number" min="0" [(ngModel)]="draft[src.value].value" [attr.aria-label]="src.label + (draft[src.value].mode === 'PERCENT' ? ' %' : ' ₹')"
                        [placeholder]="draft[src.value].mode === 'PERCENT' ? '%' : '₹ per item'" class="w-28 border border-outline-variant rounded-lg p-2 text-sm" />
                    }
                  </div>
                }
                <div class="flex gap-2 mt-2">
                  <button type="button" id="save-rules" (click)="saveRules(d)" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold">Save rules</button>
                  <button type="button" (click)="editing = null" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
                </div>
              } @else {
                <button type="button" (click)="editRules(d)" class="mt-1 text-sm underline">Set rules</button>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
})
export class PayoutsPageComponent implements OnInit {
  private payouts = inject(PayoutService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly sources = PAYOUT_SOURCES;
  readonly statuses = STATUSES;
  readonly modes: { value: PayoutMode | 'NONE'; label: string }[] = [
    { value: 'NONE', label: 'Nothing' },
    { value: 'PERCENT', label: 'Share %' },
    { value: 'FIXED', label: 'Fixed ₹' },
  ];
  tab: 'statements' | 'rules' = 'statements';
  doctors: DoctorRules[] = [];
  rows: StatementSummary[] = [];
  status: StatementStatus | '' = 'DRAFT';
  doctorId = '';
  from = '';
  to = '';
  busy = false;
  editing: string | null = null;
  draft = {} as Record<PayoutSource, RuleDraft>;

  ngOnInit(): void {
    this.lastMonth();
    this.payouts.rules().subscribe({ next: (d) => (this.doctors = d) });
    this.load();
  }

  showRules(): void {
    this.tab = 'rules';
  }

  setStatus(s: StatementStatus | ''): void {
    this.status = s;
    this.load();
  }

  load(): void {
    this.payouts.list(this.status).subscribe({ next: (p) => (this.rows = p.content) });
  }

  lastMonth(): void {
    const now = new Date();
    this.from = PayoutsPageComponent.iso(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    this.to = PayoutsPageComponent.iso(new Date(now.getFullYear(), now.getMonth(), 0));
  }

  thisMonth(): void {
    const now = new Date();
    this.from = PayoutsPageComponent.iso(new Date(now.getFullYear(), now.getMonth(), 1));
    this.to = PayoutsPageComponent.iso(now);
  }

  generate(): void {
    if (this.busy) return;
    this.busy = true;
    this.payouts.generate(this.doctorId, this.from, this.to).subscribe({
      next: (s) => {
        this.busy = false;
        this.toast.success(`${s.statementNumber} drafted`);
        this.router.navigate([s.id], { relativeTo: this.route });
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'The statement was not made.');
      },
    });
  }

  exportCsv(): void {
    this.payouts.exportCsv(this.from, this.to).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `payouts-${this.from}-to-${this.to}.csv`;
        a.click();
      },
      error: () => this.toast.error('The export did not work.'),
    });
  }

  editRules(d: DoctorRules): void {
    this.editing = d.doctorId;
    this.draft = {} as Record<PayoutSource, RuleDraft>;
    for (const s of this.sources) {
      const r = d.rules.find((x) => x.source === s.value);
      this.draft[s.value] = !r ? { mode: 'NONE', value: null }
        : { mode: r.mode, value: r.mode === 'PERCENT' ? r.percentBasisPoints / 100 : r.fixedInPaisa / 100 };
    }
  }

  saveRules(d: DoctorRules): void {
    const rules = this.sources
      .filter((s) => this.draft[s.value].mode !== 'NONE')
      .map((s) => {
        const r = this.draft[s.value];
        return r.mode === 'PERCENT'
          ? { source: s.value, mode: 'PERCENT' as PayoutMode, percentBasisPoints: Math.round((r.value ?? 0) * 100) }
          : { source: s.value, mode: 'FIXED' as PayoutMode, fixedInPaisa: Math.round((r.value ?? 0) * 100) };
      });
    this.payouts.setRules(d.doctorId, rules).subscribe({
      next: (saved) => {
        this.doctors = this.doctors.map((x) => (x.doctorId === saved.doctorId ? saved : x));
        this.editing = null;
        this.toast.success('Rules saved');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  summary(d: DoctorRules): string {
    if (!d.rules.length) return 'No payout (salaried, or not set)';
    return d.rules.map((r) => `${this.sources.find((s) => s.value === r.source)?.label}: ${r.basis}`).join(' · ');
  }

  colour(s: StatementStatus): string {
    return { DRAFT: '#f59e0b', APPROVED: '#2563eb', PAID: '#059669', CANCELLED: '#94a3b8' }[s];
  }

  money(paisa: number): string {
    return '₹' + (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  static iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
