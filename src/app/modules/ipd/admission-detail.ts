import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IpdService } from '../../core/services/ipd.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  ADMISSION_TYPES,
  AdmissionView,
  BedView,
  CHARGE_CATEGORIES,
  ChargeCategory,
  ChargeView,
  DISCHARGE_TYPES,
  DischargeType,
  PAYMENT_METHODS,
  PaymentMethod,
  WardView,
  labelOf,
  rupees,
} from '../../core/models/ipd.model';

type Panel = 'move' | 'charge' | 'advance' | 'summary' | 'bill' | 'refund' | 'discharge' | null;

/**
 * One inpatient stay, run from here: the ward moves the patient and adds charges, the billing desk takes advances
 * and makes the final bill, the doctor writes the discharge summary, and the patient is discharged. Each person sees
 * the buttons of their part; clinical details only for clinical staff.
 */
@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, ConfirmDialogComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <a routerLink="../.." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Bed board</a>

      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="admission-error">{{ error }}</div>
      } @else if (!a) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant p-4 border-l-4" [style.border-left-color]="statusColour" id="admission-header">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 class="text-xl font-semibold text-on-surface">
                <a [routerLink]="['../../../patients', a.patientId]" class="hover:underline">{{ a.patientName }}</a>
                <span class="text-sm font-normal text-slate-600">{{ a.patientCode }}{{ a.patientAge !== null ? ' · ' + a.patientAge + ' y' : '' }}{{ a.patientGender ? ' · ' + a.patientGender.toLowerCase() : '' }}</span>
              </h1>
              <p class="text-sm text-slate-700 mt-1">{{ a.admissionNumber }} · {{ typeLabel }} · Dr {{ a.doctorName }}{{ a.departmentName ? ' · ' + a.departmentName : '' }}</p>
              <p class="text-sm text-slate-700">
                @if (a.bedNumber) { <b>{{ a.wardName }}, bed {{ a.bedNumber }}</b> · }
                Admitted {{ a.admittedAt | date: 'd MMM y, h:mm a' }} · day {{ a.days }}
                @if (a.dischargedAt) { · discharged {{ a.dischargedAt | date: 'd MMM y, h:mm a' }} }
              </p>
            </div>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full" [class]="statusBadge" id="admission-status">{{ statusLabel }}</span>
          </div>

          <ol class="grid grid-cols-4 gap-1 mt-4 text-xs" id="admission-steps">
            @for (s of steps; track s.label; let i = $index) {
              <li class="rounded-lg px-2 py-1.5 text-center font-medium" [class]="s.done ? 'bg-emerald-600 text-white' : s.now ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'">
                {{ s.label }}
              </li>
            }
          </ol>
        </div>

        <div class="flex gap-2 flex-wrap my-4" id="admission-actions">
          @if (open && canManage && !a.billId) {
            <button type="button" id="action-move" (click)="openPanel('move')" class="act bg-blue-600"><span class="material-symbols-outlined text-lg">swap_horiz</span> Move bed</button>
            <button type="button" id="action-charge" (click)="openPanel('charge')" class="act bg-teal-600"><span class="material-symbols-outlined text-lg">add_card</span> Add charge</button>
          }
          @if (open && canBill && !a.billId) {
            <button type="button" id="action-advance" (click)="openPanel('advance')" class="act bg-emerald-600"><span class="material-symbols-outlined text-lg">payments</span> Take advance</button>
          }
          @if (open && canWriteSummary) {
            <button type="button" id="action-summary" (click)="openPanel('summary')" class="act bg-violet-600"><span class="material-symbols-outlined text-lg">description</span>
              {{ a.finalDiagnosis ? 'Edit discharge summary' : 'Advise discharge' }}</button>
          }
          @if (open && canBill && a.status === 'DISCHARGE_ADVISED' && !a.billId) {
            <button type="button" id="action-bill" (click)="openPanel('bill')" class="act bg-orange-600"><span class="material-symbols-outlined text-lg">receipt_long</span> Final bill</button>
          }
          @if (canBill && a.billId && a.account.balanceInPaisa < 0) {
            <button type="button" id="action-refund" (click)="openPanel('refund')" class="act bg-amber-600"><span class="material-symbols-outlined text-lg">currency_exchange</span> Give refund</button>
          }
          @if (open && canManage && a.status === 'DISCHARGE_ADVISED' && a.billId) {
            <button type="button" id="action-discharge" (click)="openPanel('discharge')" class="act bg-rose-600"><span class="material-symbols-outlined text-lg">logout</span> Discharge</button>
          }
          @if (a.billId && canBill) {
            <a [routerLink]="['../../../billing', a.billId]" id="action-view-bill" class="act bg-slate-600"><span class="material-symbols-outlined text-lg">request_quote</span> Bill {{ a.billNumber }}</a>
          }
          @if (open && a.billId && canVoid) {
            <button type="button" id="action-cancel-bill" (click)="confirmCancelBill = true" class="act bg-slate-500"><span class="material-symbols-outlined text-lg">undo</span> Cancel final bill</button>
          }
          @if (a.clinical && a.finalDiagnosis) {
            <button type="button" id="action-print" (click)="print()" class="act bg-indigo-600"><span class="material-symbols-outlined text-lg">print</span> Discharge summary</button>
          }
        </div>

        @if (panel) {
          <div class="bg-white rounded-xl border-2 border-primary p-4 mb-4 space-y-3" id="admission-panel">
            @switch (panel) {
              @case ('move') {
                <h2 class="font-semibold">Move to a free bed</h2>
                @if (freeBeds.length === 0) { <p class="text-sm text-slate-600">No free bed right now.</p> }
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" id="free-beds">
                  @for (f of freeBeds; track f.bed.id) {
                    <button type="button" (click)="moveTo = f.bed.id" class="rounded-lg border-2 p-2 text-left text-sm" [attr.data-bed]="f.bed.bedNumber"
                      [class]="moveTo === f.bed.id ? 'border-blue-600 bg-blue-50' : 'border-emerald-300 bg-emerald-50'">
                      <b>{{ f.bed.bedNumber }}</b><br /><span class="text-xs">{{ f.ward.name }} · {{ money(f.ward.dailyRateInPaisa) }}/day</span>
                    </button>
                  }
                </div>
                <input [(ngModel)]="moveReason" name="moveReason" maxlength="255" aria-label="Reason for the move" placeholder="Reason (optional), e.g. needs ICU"
                  class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
              }
              @case ('charge') {
                <h2 class="font-semibold">Add a charge</h2>
                <div class="flex gap-2 flex-wrap" id="charge-categories">
                  @for (c of categories; track c.value) {
                    <button type="button" (click)="chargeCategory = c.value" class="px-3 min-h-touch rounded-full text-sm border flex items-center gap-1"
                      [class]="chargeCategory === c.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-outline-variant'">
                      <span class="material-symbols-outlined text-base">{{ c.icon }}</span>{{ c.label }}</button>
                  }
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input id="charge-description" [(ngModel)]="chargeDescription" name="chargeDescription" maxlength="200" placeholder="What, e.g. Dressing"
                    aria-label="Description" class="col-span-2 border border-outline-variant rounded-lg p-2.5 text-sm" />
                  <input id="charge-quantity" type="number" min="1" [(ngModel)]="chargeQuantity" name="chargeQuantity" aria-label="Quantity" inputmode="numeric"
                    class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                  <input id="charge-price" type="number" min="0" [(ngModel)]="chargePrice" name="chargePrice" aria-label="Price each in rupees" placeholder="₹ each" inputmode="decimal"
                    class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                </div>
                <p class="text-sm text-slate-700">Total {{ money(chargeTotal) }}</p>
              }
              @case ('advance') {
                <h2 class="font-semibold">Take an advance</h2>
                <div class="flex gap-2 flex-wrap items-center">
                  <input id="money-amount" type="number" min="1" [(ngModel)]="moneyRupees" name="moneyRupees" aria-label="Amount in rupees" placeholder="₹" inputmode="decimal"
                    class="w-36 border border-outline-variant rounded-lg p-2.5 text-sm" />
                  @for (m of methods; track m.value) {
                    <button type="button" (click)="moneyMethod = m.value" class="px-3 min-h-touch rounded-full text-sm border"
                      [class]="moneyMethod === m.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-outline-variant'">{{ m.label }}</button>
                  }
                </div>
                <input [(ngModel)]="moneyReference" name="moneyReference" maxlength="100" aria-label="Reference" placeholder="Reference (UPI or card slip no.)"
                  class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
              }
              @case ('refund') {
                <h2 class="font-semibold">Give back {{ money(-a.account.balanceInPaisa) }}</h2>
                <div class="flex gap-2 flex-wrap items-center">
                  <input id="money-amount" type="number" min="1" [(ngModel)]="moneyRupees" name="moneyRupees" aria-label="Amount in rupees" inputmode="decimal"
                    class="w-36 border border-outline-variant rounded-lg p-2.5 text-sm" />
                  @for (m of methods; track m.value) {
                    <button type="button" (click)="moneyMethod = m.value" class="px-3 min-h-touch rounded-full text-sm border"
                      [class]="moneyMethod === m.value ? 'bg-amber-600 text-white border-amber-600' : 'bg-white border-outline-variant'">{{ m.label }}</button>
                  }
                </div>
              }
              @case ('summary') {
                <h2 class="font-semibold">Discharge summary</h2>
                <div>
                  <label for="summary-diagnosis" class="block text-sm font-medium mb-1">Final diagnosis *</label>
                  <input id="summary-diagnosis" [(ngModel)]="finalDiagnosis" name="finalDiagnosis" maxlength="1000" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
                </div>
                <div>
                  <label for="summary-treatment" class="block text-sm font-medium mb-1">Treatment given</label>
                  <textarea id="summary-treatment" [(ngModel)]="treatmentGiven" name="treatmentGiven" rows="3" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm"></textarea>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label for="summary-condition" class="block text-sm font-medium mb-1">Condition at discharge</label>
                    <input id="summary-condition" [(ngModel)]="conditionAtDischarge" name="conditionAtDischarge" maxlength="500" placeholder="e.g. Stable, afebrile"
                      class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
                  </div>
                  <div>
                    <label for="summary-follow-up" class="block text-sm font-medium mb-1">Follow-up on</label>
                    <input id="summary-follow-up" type="date" [(ngModel)]="followUpDate" name="followUpDate" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
                  </div>
                </div>
                <div>
                  <label for="summary-advice" class="block text-sm font-medium mb-1">Advice and medicines at home</label>
                  <textarea id="summary-advice" [(ngModel)]="dischargeAdvice" name="dischargeAdvice" rows="3" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm"></textarea>
                </div>
                <div class="flex gap-2 flex-wrap" id="discharge-types">
                  @for (t of dischargeTypes; track t.value) {
                    <button type="button" (click)="dischargeType = t.value" class="px-3 min-h-touch rounded-full text-sm border"
                      [class]="dischargeType === t.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-outline-variant'">{{ t.label }}</button>
                  }
                </div>
              }
              @case ('bill') {
                <h2 class="font-semibold">Final bill</h2>
                <p class="text-sm text-slate-700">Beds {{ money(a.account.bedChargesInPaisa) }} + charges {{ money(a.account.otherChargesInPaisa) }}; the clinic's GST is added. Advances of {{ money(a.account.depositsInPaisa) }} are credited.</p>
                <label for="bill-discount" class="block text-sm font-medium">Discount (₹)</label>
                <input id="bill-discount" type="number" min="0" [(ngModel)]="discountRupees" name="discountRupees" inputmode="decimal"
                  class="w-36 border border-outline-variant rounded-lg p-2.5 text-sm" />
              }
              @case ('discharge') {
                <h2 class="font-semibold">Discharge {{ a.patientName }}</h2>
                @if (a.account.balanceInPaisa > 0) {
                  <p class="text-sm text-status-red" id="dues">{{ money(a.account.balanceInPaisa) }} is still due.</p>
                  @if (canBill) {
                    <input id="dues-note" [(ngModel)]="duesNote" name="duesNote" maxlength="255" aria-label="Why the patient leaves with dues"
                      placeholder="Why the patient leaves with dues, e.g. insurance claim pending" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
                  } @else {
                    <p class="text-sm text-slate-700">The billing desk settles it, or lets the patient go with dues.</p>
                  }
                } @else {
                  <p class="text-sm text-slate-700">The bill is settled. The bed goes for cleaning.</p>
                }
              }
            }
            @if (panelError) { <p class="text-sm text-status-red" id="panel-error">{{ panelError }}</p> }
            <div class="flex gap-2">
              <button type="button" id="panel-save" (click)="save()" [disabled]="busy || !panelReady"
                class="px-5 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">{{ busy ? 'Saving…' : saveLabel }}</button>
              <button type="button" (click)="panel = null" class="px-4 min-h-touch text-sm border border-outline-variant rounded-lg">Cancel</button>
            </div>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section class="bg-white rounded-xl border border-outline-variant p-4" id="account">
            <h2 class="font-semibold mb-2">{{ a.account.finalBill ? 'Final bill' : 'Running estimate' }}</h2>
            <dl class="text-sm space-y-1">
              <div class="flex justify-between"><dt>Beds</dt><dd>{{ money(a.account.bedChargesInPaisa) }}</dd></div>
              <div class="flex justify-between"><dt>Charges</dt><dd>{{ money(a.account.otherChargesInPaisa) }}</dd></div>
              @if (a.account.discountInPaisa) { <div class="flex justify-between"><dt>Discount</dt><dd>− {{ money(a.account.discountInPaisa) }}</dd></div> }
              @if (a.account.taxInPaisa) { <div class="flex justify-between"><dt>GST</dt><dd>{{ money(a.account.taxInPaisa) }}</dd></div> }
              <div class="flex justify-between font-semibold border-t pt-1"><dt>Total</dt><dd id="account-total">{{ money(a.account.totalInPaisa) }}</dd></div>
              <div class="flex justify-between"><dt>Advances</dt><dd>{{ money(a.account.depositsInPaisa) }}</dd></div>
              @if (a.account.refundsInPaisa) { <div class="flex justify-between"><dt>Refunded</dt><dd>{{ money(a.account.refundsInPaisa) }}</dd></div> }
            </dl>
            <div class="mt-3 rounded-lg p-3 font-semibold text-sm" [class]="balanceClass" id="account-balance">{{ balanceLabel }}</div>
          </section>

          <section class="bg-white rounded-xl border border-outline-variant p-4" id="clinical">
            <h2 class="font-semibold mb-2">Clinical</h2>
            <p class="text-sm"><b>Reason:</b> {{ a.reason }}</p>
            @if (a.clinical) {
              @if (a.provisionalDiagnosis) { <p class="text-sm mt-1"><b>Provisional diagnosis:</b> {{ a.provisionalDiagnosis }}</p> }
              @if (a.finalDiagnosis) {
                <p class="text-sm mt-1" id="final-diagnosis"><b>Final diagnosis:</b> {{ a.finalDiagnosis }}</p>
                @if (a.treatmentGiven) { <p class="text-sm mt-1 whitespace-pre-line"><b>Treatment:</b> {{ a.treatmentGiven }}</p> }
                @if (a.conditionAtDischarge) { <p class="text-sm mt-1"><b>Condition:</b> {{ a.conditionAtDischarge }}</p> }
                @if (a.dischargeAdvice) { <p class="text-sm mt-1 whitespace-pre-line"><b>Advice:</b> {{ a.dischargeAdvice }}</p> }
                @if (a.followUpDate) { <p class="text-sm mt-1"><b>Follow-up:</b> {{ a.followUpDate | date: 'd MMM y' }}</p> }
                <p class="text-xs text-slate-600 mt-1">Discharge advised by {{ a.advisedBy }} {{ a.advisedAt | date: 'd MMM, h:mm a' }} · {{ dischargeTypeLabel }}</p>
              }
            } @else {
              <p class="text-sm text-slate-600 mt-1" id="clinical-hidden">Diagnosis and treatment are for the clinical team.</p>
            }
            @if (a.attendantName) {
              <p class="text-sm mt-3"><b>Attendant:</b> {{ a.attendantName }}{{ a.attendantRelation ? ' (' + a.attendantRelation + ')' : '' }}{{ a.attendantPhone ? ' · ' + a.attendantPhone : '' }}</p>
            }
            @if (a.duesNote) { <p class="text-sm mt-2 text-amber-800"><b>Left with dues:</b> {{ a.duesNote }}</p> }
          </section>

          <section class="bg-white rounded-xl border border-outline-variant p-4" id="charges">
            <h2 class="font-semibold mb-2">Charges</h2>
            @for (s of a.stays; track s.fromTime) {
              <div class="flex justify-between text-sm py-1 border-b border-dashed">
                <span><span class="material-symbols-outlined text-base align-middle text-blue-700">bed</span> {{ s.wardName }}, bed {{ s.bedNumber }} · {{ s.days }} × {{ money(s.dailyRateInPaisa) }}</span>
                <span>{{ money(s.amountInPaisa) }}</span>
              </div>
            }
            @for (c of a.charges; track c.id) {
              <div class="flex justify-between items-center text-sm py-1 border-b border-dashed" [attr.data-charge]="c.description">
                <span><span class="material-symbols-outlined text-base align-middle text-teal-700">{{ categoryIcon(c) }}</span>
                  {{ c.description }}{{ c.quantity > 1 ? ' × ' + c.quantity : '' }} <span class="text-xs text-slate-600">{{ c.chargedOn | date: 'd MMM' }}</span></span>
                <span class="flex items-center gap-1">{{ money(c.amountInPaisa) }}
                  @if (open && canManage && !a.billId) {
                    <button type="button" (click)="removeCharge(c)" [attr.aria-label]="'Remove ' + c.description" class="p-1 text-status-red">
                      <span class="material-symbols-outlined text-base">close</span></button>
                  }
                </span>
              </div>
            }
            @if (a.charges.length === 0) { <p class="text-sm text-slate-600">No charges besides the bed yet.</p> }
          </section>

          <section class="bg-white rounded-xl border border-outline-variant p-4" id="money">
            <h2 class="font-semibold mb-2">Advances and refunds</h2>
            @for (d of a.deposits; track d.id) {
              <div class="flex justify-between text-sm py-1 border-b border-dashed">
                <span>{{ d.kind === 'DEPOSIT' ? 'Advance' : 'Refund' }} · {{ methodLabel(d.paymentMethod) }}{{ d.reference ? ' · ' + d.reference : '' }}
                  <span class="text-xs text-slate-600">{{ d.receivedAt | date: 'd MMM, h:mm a' }}{{ d.receivedBy ? ' · ' + d.receivedBy : '' }}</span></span>
                <span [class]="d.kind === 'REFUND' ? 'text-amber-700' : 'text-emerald-700'">{{ d.kind === 'REFUND' ? '−' : '' }}{{ money(d.amountInPaisa) }}</span>
              </div>
            }
            @if (a.deposits.length === 0) { <p class="text-sm text-slate-600">None.</p> }
            <h2 class="font-semibold mt-4 mb-2">Beds</h2>
            @for (s of a.stays; track s.fromTime) {
              <p class="text-sm">{{ s.wardName }}, bed {{ s.bedNumber }}: {{ s.fromTime | date: 'd MMM, h:mm a' }} → {{ s.toTime ? (s.toTime | date: 'd MMM, h:mm a') : 'now' }}
                @if (s.reason) { <span class="text-slate-600">({{ s.reason }})</span> }</p>
            }
          </section>
        </div>
      }
    </div>

    <app-confirm-dialog
      [open]="confirmCancelBill"
      title="Cancel the final bill"
      message="The bill is cancelled and the advances go back to the stay, so charges can be changed. Bill again afterwards."
      confirmText="Cancel bill"
      [isDestructive]="true"
      (confirmed)="cancelBill()"
      (cancelled)="confirmCancelBill = false"
    />
  `,
  styles: [`.act { display: flex; align-items: center; gap: 0.25rem; padding: 0 1rem; min-height: 44px; border-radius: 0.5rem; color: white; font-size: 0.875rem; font-weight: 600; }`],
})
export class AdmissionDetailComponent implements OnInit {
  private ipd = inject(IpdService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  a: AdmissionView | null = null;
  error = '';
  panel: Panel = null;
  panelError = '';
  busy = false;
  confirmCancelBill = false;

  readonly categories = CHARGE_CATEGORIES;
  readonly methods = PAYMENT_METHODS;
  readonly dischargeTypes = DISCHARGE_TYPES;

  freeBeds: { ward: WardView; bed: BedView }[] = [];
  moveTo = '';
  moveReason = '';
  chargeCategory: ChargeCategory = 'PROCEDURE';
  chargeDescription = '';
  chargeQuantity = 1;
  chargePrice: number | null = null;
  moneyRupees: number | null = null;
  moneyMethod: PaymentMethod = 'CASH';
  moneyReference = '';
  finalDiagnosis = '';
  treatmentGiven = '';
  conditionAtDischarge = '';
  dischargeAdvice = '';
  followUpDate = '';
  dischargeType: DischargeType = 'NORMAL';
  discountRupees: number | null = null;
  duesNote = '';

  get open(): boolean {
    return !!this.a && this.a.status !== 'DISCHARGED';
  }

  get canManage(): boolean {
    return this.auth.can('IPD_MANAGE');
  }

  get canBill(): boolean {
    return this.auth.can('BILLING');
  }

  get canVoid(): boolean {
    return this.auth.can('BILL_VOID');
  }

  get canWriteSummary(): boolean {
    return this.auth.can('CONSULTATION_EDIT') && !!this.a?.clinical;
  }

  get steps(): { label: string; done: boolean; now: boolean }[] {
    const a = this.a!;
    const advised = a.status !== 'ADMITTED';
    const billed = !!a.billId;
    const gone = a.status === 'DISCHARGED';
    return [
      { label: 'Admitted', done: true, now: false },
      { label: 'Discharge advised', done: advised, now: !advised },
      { label: 'Final bill', done: billed, now: advised && !billed },
      { label: 'Discharged', done: gone, now: billed && !gone },
    ];
  }

  get statusLabel(): string {
    return { ADMITTED: 'In hospital', DISCHARGE_ADVISED: 'Discharge advised', DISCHARGED: 'Discharged' }[this.a!.status];
  }

  get statusBadge(): string {
    return { ADMITTED: 'bg-blue-100 text-blue-800', DISCHARGE_ADVISED: 'bg-violet-100 text-violet-800', DISCHARGED: 'bg-slate-100 text-slate-700' }[this.a!.status];
  }

  get statusColour(): string {
    return { ADMITTED: '#2563eb', DISCHARGE_ADVISED: '#7c3aed', DISCHARGED: '#94a3b8' }[this.a!.status];
  }

  get typeLabel(): string {
    return labelOf(ADMISSION_TYPES, this.a!.admissionType);
  }

  get dischargeTypeLabel(): string {
    return labelOf(DISCHARGE_TYPES, this.a!.dischargeType);
  }

  get balanceLabel(): string {
    const b = this.a!.account.balanceInPaisa;
    if (b > 0) return `${rupees(b)} to pay`;
    if (b < 0) return `${rupees(-b)} to give back`;
    return 'Settled';
  }

  get balanceClass(): string {
    const b = this.a!.account.balanceInPaisa;
    return b > 0 ? 'bg-red-50 text-red-800' : b < 0 ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-800';
  }

  get chargeTotal(): number {
    return Math.round((this.chargePrice ?? 0) * 100) * Math.max(1, this.chargeQuantity || 1);
  }

  get panelReady(): boolean {
    switch (this.panel) {
      case 'move':
        return !!this.moveTo;
      case 'charge':
        return this.chargeDescription.trim().length >= 2 && this.chargeQuantity >= 1 && (this.chargePrice ?? -1) >= 0;
      case 'advance':
      case 'refund':
        return (this.moneyRupees ?? 0) > 0;
      case 'summary':
        return this.finalDiagnosis.trim().length >= 3;
      case 'discharge':
        return this.a!.account.balanceInPaisa <= 0 || (this.canBill && this.duesNote.trim().length >= 3);
      default:
        return true;
    }
  }

  get saveLabel(): string {
    return {
      move: 'Move',
      charge: 'Add charge',
      advance: 'Save advance',
      refund: 'Save refund',
      summary: 'Save and advise discharge',
      bill: 'Make final bill',
      discharge: 'Discharge',
    }[this.panel ?? 'move'] as string;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ipd.get(id).subscribe({
      next: (a) => (this.a = a),
      error: (err) => (this.error = err?.error?.message || 'The admission could not be loaded.'),
    });
  }

  openPanel(panel: Panel): void {
    const a = this.a!;
    this.panel = panel;
    this.panelError = '';
    this.moneyRupees = panel === 'refund' ? -a.account.balanceInPaisa / 100 : null;
    this.moneyMethod = 'CASH';
    this.moneyReference = '';
    if (panel === 'move') {
      this.moveTo = '';
      this.moveReason = '';
      this.ipd.board().subscribe({
        next: (b) =>
          (this.freeBeds = b.wards.flatMap((ward) => ward.beds.filter((bed) => bed.status === 'AVAILABLE').map((bed) => ({ ward, bed })))),
      });
    }
    if (panel === 'charge') {
      this.chargeDescription = '';
      this.chargeQuantity = 1;
      this.chargePrice = null;
    }
    if (panel === 'summary') {
      this.finalDiagnosis = a.finalDiagnosis ?? a.provisionalDiagnosis ?? '';
      this.treatmentGiven = a.treatmentGiven ?? '';
      this.conditionAtDischarge = a.conditionAtDischarge ?? '';
      this.dischargeAdvice = a.dischargeAdvice ?? '';
      this.followUpDate = a.followUpDate ?? '';
      this.dischargeType = a.dischargeType ?? 'NORMAL';
    }
    if (panel === 'bill') this.discountRupees = null;
    if (panel === 'discharge') this.duesNote = '';
  }

  save(): void {
    if (!this.a || this.busy || !this.panelReady) return;
    const id = this.a.id;
    const money = { amountInPaisa: Math.round((this.moneyRupees ?? 0) * 100), paymentMethod: this.moneyMethod, reference: this.moneyReference.trim() || null };
    const call = {
      move: () => this.ipd.transfer(id, this.moveTo, this.moveReason.trim()),
      charge: () =>
        this.ipd.addCharge(id, {
          category: this.chargeCategory,
          description: this.chargeDescription.trim(),
          quantity: this.chargeQuantity,
          unitPriceInPaisa: Math.round((this.chargePrice ?? 0) * 100),
        }),
      advance: () => this.ipd.deposit(id, money),
      refund: () => this.ipd.refund(id, money),
      summary: () =>
        this.ipd.writeSummary(id, {
          finalDiagnosis: this.finalDiagnosis.trim(),
          treatmentGiven: this.treatmentGiven.trim() || null,
          conditionAtDischarge: this.conditionAtDischarge.trim() || null,
          dischargeAdvice: this.dischargeAdvice.trim() || null,
          followUpDate: this.followUpDate || null,
          dischargeType: this.dischargeType,
        }),
      bill: () => this.ipd.finalBill(id, Math.round((this.discountRupees ?? 0) * 100)),
      discharge: () => this.ipd.discharge(id, this.duesNote.trim() || null),
    }[this.panel!];
    const done = this.saveLabel;
    this.busy = true;
    this.panelError = '';
    call().subscribe({
      next: (a) => {
        this.busy = false;
        this.a = a;
        this.panel = null;
        this.toast.success(done.replace('Save and ', '').replace(/^Save /, '') + ': done');
      },
      error: (err) => {
        this.busy = false;
        this.panelError = err?.error?.message || 'That did not work. Try again.';
      },
    });
  }

  removeCharge(c: ChargeView): void {
    this.ipd.removeCharge(this.a!.id, c.id).subscribe({
      next: (a) => {
        this.a = a;
        this.toast.success(`${c.description} removed`);
      },
      error: (err) => this.toast.error(err?.error?.message || 'The charge could not be removed.'),
    });
  }

  cancelBill(): void {
    this.confirmCancelBill = false;
    this.ipd.cancelFinalBill(this.a!.id).subscribe({
      next: (a) => {
        this.a = a;
        this.toast.success('Final bill cancelled');
      },
      error: (err) => this.toast.error(err?.error?.message || 'The bill could not be cancelled.'),
    });
  }

  print(): void {
    this.ipd.summaryPdf(this.a!.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toast.error('The discharge summary could not be opened.'),
    });
  }

  money(paisa: number): string {
    return rupees(paisa);
  }

  categoryIcon(c: ChargeView): string {
    return CHARGE_CATEGORIES.find((x) => x.value === c.category)?.icon ?? 'receipt';
  }

  methodLabel(m: PaymentMethod): string {
    return labelOf(PAYMENT_METHODS, m);
  }
}
