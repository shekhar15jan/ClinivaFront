import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InsuranceService } from '../../core/services/insurance.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { CLAIM_STATUS_LABEL, CLAIM_STATUS_STYLE, Claim, NEXT_STEPS, STEP_AMOUNT, STEP_LABEL, Step } from '../../core/models/insurance.model';

/** One claim: its amounts, the timeline, and the next steps the insurer's answers allow. */
@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Insurance</a>
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      } @else if (c) {
        <div class="bg-white rounded-xl border border-outline-variant p-4 mb-3" id="claim-header">
          <div class="flex justify-between gap-2 flex-wrap">
            <h1 class="text-xl font-semibold">{{ c.patientName }} <span class="text-sm font-normal text-slate-600">{{ c.claimNumber }}</span></h1>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full" [class]="statusStyle" id="claim-status">{{ statusLabel }}</span>
          </div>
          <p class="text-sm text-slate-700">{{ c.payerName }}{{ c.tpaName ? ' via ' + c.tpaName : '' }} · policy {{ c.policyNumber }}{{ c.memberId ? ' · member ' + c.memberId : '' }}</p>
          <p class="text-sm text-slate-700">Stay <a [routerLink]="['../../ipd/admissions', c.admissionId]" class="underline">{{ c.admissionNumber }}</a>
            {{ c.packageCode ? ' · package ' + c.packageCode + (c.packageName ? ' ' + c.packageName : '') : '' }}
            {{ c.payerReference ? ' · insurer ref ' + c.payerReference : '' }}{{ c.discharged ? ' · discharged' : '' }}</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm" id="claim-amounts">
            <div><p class="text-xs text-slate-600">Asked</p><p class="font-semibold">{{ money(c.requestedInPaisa) }}</p></div>
            <div><p class="text-xs text-slate-600">Approved</p><p class="font-semibold">{{ money(c.approvedInPaisa) }}</p></div>
            <div><p class="text-xs text-slate-600">Claimed{{ c.billTotalInPaisa ? ' (bill ' + money(c.billTotalInPaisa) + ')' : '' }}</p><p class="font-semibold">{{ money(c.claimedInPaisa) }}</p></div>
            <div><p class="text-xs text-slate-600">Received{{ c.tdsInPaisa ? ' + TDS ' + money(c.tdsInPaisa) : '' }}</p><p class="font-semibold">{{ money(c.settledInPaisa) }}</p></div>
          </div>
          @if (c.deductionInPaisa) { <p class="text-sm text-amber-800 mt-1">Disallowed by the insurer: {{ money(c.deductionInPaisa) }} (the patient's to pay)</p> }
        </div>

        <div class="flex gap-2 flex-wrap mb-3" id="claim-steps">
          @for (s of steps; track s) {
            <button type="button" (click)="choose(s)" class="px-3 min-h-touch rounded-lg text-sm border" [attr.data-step]="s"
              [class]="step === s ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ stepLabel(s) }}</button>
          }
        </div>
        @if (step) {
          <div class="bg-white rounded-xl border-2 border-primary p-3 mb-3 space-y-2" id="step-form">
            @if (amountLabel) {
              <label class="block text-sm font-medium">{{ amountLabel }} (₹)
                <input id="step-amount" type="number" min="0" [(ngModel)]="amount" class="mt-1 w-40 border border-outline-variant rounded-lg p-2 text-sm block" /></label>
            }
            @if (step === 'SETTLE') {
              <label class="block text-sm font-medium">TDS deducted (₹)
                <input id="step-tds" type="number" min="0" [(ngModel)]="tds" class="mt-1 w-40 border border-outline-variant rounded-lg p-2 text-sm block" /></label>
            }
            @if (step !== 'NOTE' && step !== 'QUERY' && step !== 'CANCEL') {
              <input [(ngModel)]="reference" maxlength="60" aria-label="Insurer's reference" placeholder="Insurer's reference (optional)" class="w-full border border-outline-variant rounded-lg p-2 text-sm" />
            }
            <textarea id="step-note" [(ngModel)]="note" rows="2" maxlength="1000" aria-label="Note" [placeholder]="step === 'QUERY' ? 'What the insurer asked' : 'Note (optional)'"
              class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
            <div class="flex gap-2">
              <button type="button" id="step-save" (click)="save()" [disabled]="busy || !ready" class="px-5 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Save</button>
              <button type="button" (click)="step = null" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
            </div>
          </div>
        }

        <section class="bg-white rounded-xl border border-outline-variant p-3" id="claim-timeline">
          <h2 class="font-semibold mb-2">Timeline</h2>
          @for (e of c.events; track $index) {
            <p class="text-sm py-1 border-b border-dashed"><b>{{ eventLabel(e.kind) }}</b>{{ e.amountInPaisa !== null ? ' · ' + money(e.amountInPaisa) : '' }}{{ e.note ? ' · ' + e.note : '' }}
              <span class="text-xs text-slate-600">{{ e.at | date: 'd MMM, h:mm a' }}{{ e.by ? ' · ' + e.by : '' }}</span></p>
          }
        </section>
      }
    </div>
  `,
})
export class ClaimDetailComponent implements OnInit {
  private insurance = inject(InsuranceService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  c: Claim | null = null;
  error = '';
  step: Step | null = null;
  amount: number | null = null;
  tds: number | null = null;
  reference = '';
  note = '';
  busy = false;

  get steps(): Step[] {
    return this.c ? NEXT_STEPS[this.c.status] : [];
  }

  get statusLabel(): string {
    return CLAIM_STATUS_LABEL[this.c!.status];
  }

  get statusStyle(): string {
    return CLAIM_STATUS_STYLE[this.c!.status];
  }

  get amountLabel(): string | undefined {
    return this.step ? STEP_AMOUNT[this.step] : undefined;
  }

  get ready(): boolean {
    if (!this.step) return false;
    if (this.amountLabel && (this.amount === null || this.amount < 0)) return false;
    if ((this.step === 'QUERY' || this.step === 'NOTE') && this.note.trim().length < 3) return false;
    return true;
  }

  ngOnInit(): void {
    this.insurance.get(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: (c) => (this.c = c),
      error: (err) => (this.error = err?.error?.message || 'The claim could not be loaded.'),
    });
  }

  choose(s: Step): void {
    this.step = s;
    this.reference = '';
    this.note = '';
    this.tds = null;
    const c = this.c!;
    // The amount the step most likely uses, ready to confirm.
    const suggested: Partial<Record<Step, number | null>> = {
      SUBMIT_PREAUTH: c.requestedInPaisa,
      APPROVE: c.requestedInPaisa,
      SUBMIT_CLAIM: c.approvedInPaisa,
      SETTLE: c.claimedInPaisa,
    };
    const v = suggested[s];
    this.amount = v === null || v === undefined ? null : v / 100;
  }

  save(): void {
    if (!this.c || !this.step || !this.ready) return;
    this.busy = true;
    const paisa = (r: number | null) => (r === null ? null : Math.round(r * 100));
    this.insurance.step(this.c.id, this.step, this.amountLabel ? paisa(this.amount) : null, this.step === 'SETTLE' ? paisa(this.tds) : null,
      this.reference.trim() || null, this.note.trim() || null).subscribe({
      next: (c) => {
        this.busy = false;
        this.c = c;
        this.toast.success(`${STEP_LABEL[this.step!]}: saved`);
        this.step = null;
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'Not saved.');
      },
    });
  }

  stepLabel(s: Step): string {
    return STEP_LABEL[s];
  }

  eventLabel(kind: string): string {
    return kind === 'OPENED' ? 'Claim opened' : STEP_LABEL[kind as Step] ?? kind;
  }

  money(paisa: number | null): string {
    return paisa === null ? '—' : '₹' + (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
}
