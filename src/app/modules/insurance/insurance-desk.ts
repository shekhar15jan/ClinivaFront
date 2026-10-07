import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InsuranceService } from '../../core/services/insurance.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { CLAIM_STATUS_LABEL, CLAIM_STATUS_STYLE, ClaimSummary, Payer, PayerKind, Receivables } from '../../core/models/insurance.model';
import { formatMoney } from '../../core/utils/money';

const STAGES = [
  { value: '', label: 'Open' },
  { value: 'preauth', label: 'Pre-auth' },
  { value: 'approved', label: 'Approved' },
  { value: 'claimed', label: 'Awaiting payment' },
  { value: 'settled', label: 'Settled' },
  { value: 'rejected', label: 'Rejected' },
];

/**
 * The insurance desk: claims by stage, what insurers owe, and the payers list. Claims are recorded here; the insurer's
 * or scheme's own portal (PM-JAY TMS, a TPA's site) is where they are filed.
 */
@Component({
  selector: 'app-insurance-desk',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <h1 class="text-2xl font-semibold text-on-surface">Insurance</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Cashless claims for inpatients. File them on the insurer's or PM-JAY's portal; record each step here.</p>

      @if (receivables; as r) {
        <div class="grid grid-cols-2 gap-2 mb-3 max-w-md" id="receivables">
          <div class="rounded-xl p-3 bg-violet-600 text-white"><p class="text-xs opacity-90">Insurers owe</p><p class="text-xl font-bold">{{ money(r.expectedInPaisa) }}</p></div>
          <div class="rounded-xl p-3 bg-slate-600 text-white"><p class="text-xs opacity-90">Open claims</p><p class="text-xl font-bold">{{ r.claims }}</p></div>
        </div>
      }

      <div class="flex gap-2 overflow-x-auto pb-2" id="claim-stages">
        @for (s of stages; track s.value) {
          <button type="button" (click)="setStage(s.value)" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
            [class]="tab === 'claims' && stage === s.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ s.label }}</button>
        }
        <button type="button" id="tab-payers" (click)="showPayers()" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
          [class]="tab === 'payers' ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">Payers</button>
      </div>

      @if (tab === 'claims') {
        <div class="space-y-2 mt-2" id="claims">
          @for (c of claims; track c.id) {
            <a [routerLink]="[c.id]" class="block bg-white rounded-xl border border-outline-variant p-3" [attr.data-claim]="c.claimNumber">
              <div class="flex justify-between gap-2 flex-wrap">
                <p class="font-semibold">{{ c.patientName }} <span class="text-sm font-normal text-slate-600">{{ c.claimNumber }} · {{ c.admissionNumber }}</span></p>
                <span class="text-xs font-semibold px-2 py-1 rounded-full" [class]="style(c)">{{ label(c) }}</span>
              </div>
              <p class="text-sm text-slate-700">{{ c.payerName }}{{ c.expectedInPaisa ? ' · expected ' + money(c.expectedInPaisa) : '' }}{{ c.settledInPaisa ? ' · received ' + money(c.settledInPaisa) : '' }}
                · {{ c.createdAt | date: 'd MMM y' }}</p>
            </a>
          }
          @if (claims.length === 0) { <p class="text-sm text-slate-600" id="no-claims">No claims here.</p> }
        </div>
      } @else {
        <div class="flex gap-2 flex-wrap my-2">
          <button type="button" id="add-common-payers" (click)="addCommon()" class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white">Add PM-JAY and common insurers</button>
          <input [(ngModel)]="newPayer" aria-label="New payer" placeholder="Insurer, TPA or scheme" maxlength="150" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
          <select [(ngModel)]="newKind" aria-label="Kind" class="border border-outline-variant rounded-lg p-2.5 text-sm">
            <option value="INSURER">Insurer</option><option value="TPA">TPA</option><option value="SCHEME">Scheme</option>
          </select>
          <button type="button" (click)="addPayer()" [disabled]="newPayer.trim().length < 2" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm disabled:opacity-50">Add</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="payers">
          @for (p of payers; track p.id) {
            <div class="bg-white rounded-xl border border-outline-variant p-3 text-sm" [attr.data-payer]="p.name">
              <b>{{ p.name }}</b> <span class="text-slate-600">· {{ p.kind.toLowerCase() }}{{ p.code ? ' · ' + p.code : '' }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class InsuranceDeskComponent implements OnInit {
  private insurance = inject(InsuranceService);
  private toast = inject(ToastService);

  readonly stages = STAGES;
  tab: 'claims' | 'payers' = 'claims';
  stage = '';
  claims: ClaimSummary[] = [];
  receivables: Receivables | null = null;
  payers: Payer[] = [];
  newPayer = '';
  newKind: PayerKind = 'INSURER';

  ngOnInit(): void {
    this.load();
    this.insurance.receivables().subscribe({ next: (r) => (this.receivables = r) });
  }

  setStage(stage: string): void {
    this.tab = 'claims';
    this.stage = stage;
    this.load();
  }

  load(): void {
    this.insurance.claims(this.stage).subscribe({
      next: (p) => (this.claims = p.content),
      error: (err) => this.toast.error(err?.error?.message || 'The claims could not be loaded.'),
    });
  }

  showPayers(): void {
    this.tab = 'payers';
    this.insurance.payers().subscribe({ next: (p) => (this.payers = p) });
  }

  addCommon(): void {
    this.insurance.addCommonPayers().subscribe({ next: (p) => { this.payers = p; this.toast.success('Payers added'); } });
  }

  addPayer(): void {
    this.insurance.addPayer(this.newPayer.trim(), this.newKind).subscribe({
      next: () => { this.newPayer = ''; this.showPayers(); },
      error: (err) => this.toast.error(err?.error?.message || 'Not added.'),
    });
  }

  label(c: ClaimSummary): string {
    return CLAIM_STATUS_LABEL[c.status];
  }

  style(c: ClaimSummary): string {
    return CLAIM_STATUS_STYLE[c.status];
  }

  money(paisa: number): string {
    return formatMoney(paisa);
  }
}
