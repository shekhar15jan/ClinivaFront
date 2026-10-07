import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { LabService } from '../../core/services/lab.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { FLAG_STYLE, Flag, ItemView, ORDER_STATUS_LABEL, OrderView, ParameterView, flagOf } from '../../core/models/lab.model';
import { formatMoney } from '../../core/utils/money';

/**
 * One lab order: the lab collects the samples and enters each test's results (out-of-range values shown as they are
 * typed), a doctor verifies them, and the report is released. The desk bills an outpatient's tests here.
 */
@Component({
  selector: 'app-lab-order',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Lab</a>
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="lab-order-error">{{ error }}</div>
      } @else if (!o) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant p-4 border-l-4 mb-3" [style.border-left-color]="o.priority === 'URGENT' ? '#dc2626' : '#2563eb'" id="lab-order-header">
          <div class="flex justify-between gap-2 flex-wrap">
            <h1 class="text-xl font-semibold">{{ o.patientName }} <span class="text-sm font-normal text-slate-600">{{ o.patientCode }}{{ o.patientAge !== null ? ' · ' + o.patientAge + ' y' : '' }}</span></h1>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100" id="lab-order-status">{{ statusLabel }}</span>
          </div>
          <p class="text-sm text-slate-700">{{ o.orderNumber }}{{ o.priority === 'URGENT' ? ' · URGENT' : '' }}{{ o.doctorName ? ' · Dr ' + o.doctorName : '' }}
            {{ o.admissionNumber ? ' · inpatient ' + o.admissionNumber : '' }} · {{ o.orderedAt | date: 'd MMM, h:mm a' }}</p>
          @if (o.clinicalNote) { <p class="text-sm mt-1"><b>Note:</b> {{ o.clinicalNote }}</p> }
          @if (o.billNumber) { <p class="text-sm mt-1">Billed: {{ o.billNumber }}</p> }
        </div>

        <div class="flex gap-2 flex-wrap mb-3" id="lab-actions">
          @if (canProcess && hasPending) {
            <button type="button" id="lab-collect" (click)="run(lab.collect(o.id), 'Samples collected')" class="act bg-teal-600"><span class="material-symbols-outlined text-lg">colorize</span> Collect samples</button>
          }
          @if (canBill && !o.admissionId && !o.billId && o.status !== 'CANCELLED') {
            <button type="button" id="lab-bill" (click)="run(lab.bill(o.id), 'Bill made')" class="act bg-orange-600"><span class="material-symbols-outlined text-lg">receipt_long</span> Bill {{ money(o.totalInPaisa) }}</button>
          }
          @if (o.billId && canBill) {
            <a [routerLink]="['../../billing', o.billId]" class="act bg-slate-600"><span class="material-symbols-outlined text-lg">request_quote</span> Bill {{ o.billNumber }}</a>
          }
          @if (o.results && hasVerified) {
            <button type="button" id="lab-report" (click)="report()" class="act bg-indigo-600"><span class="material-symbols-outlined text-lg">print</span> Report</button>
          }
        </div>

        <div class="space-y-3" id="lab-items">
          @for (i of o.items; track i.id) {
            <section class="bg-white rounded-xl border border-outline-variant p-3" [attr.data-item]="i.testName">
              <div class="flex justify-between gap-2 flex-wrap items-start">
                <div>
                  <h2 class="font-semibold">{{ i.testName }}</h2>
                  <p class="text-xs text-slate-600">{{ itemLine(i) }}</p>
                </div>
                <div class="flex gap-2 items-center">
                  <span class="text-xs font-semibold px-2 py-1 rounded-full" [class]="itemBadge(i)" [attr.data-status]="i.status">{{ i.status.toLowerCase() }}</span>
                  @if (canCancel && (i.status === 'PENDING' || i.status === 'COLLECTED')) {
                    <button type="button" (click)="cancel(i)" class="text-xs text-status-red underline" [attr.aria-label]="'Cancel ' + i.testName">Cancel</button>
                  }
                </div>
              </div>

              @if (o.results) {
                @if (editing === i.id) {
                  <div class="mt-2 space-y-2" [attr.data-entry]="i.testName">
                    @for (p of i.parameters; track p.id) {
                      <div class="grid grid-cols-12 gap-2 items-center text-sm">
                        <label [for]="'v-' + p.id" class="col-span-5">{{ p.name }}</label>
                        <input [id]="'v-' + p.id" [(ngModel)]="draft[p.id]" [attr.aria-label]="p.name" class="col-span-3 border border-outline-variant rounded-lg p-2"
                          [class]="liveFlag(p) ? flagClass(liveFlag(p)!) : ''" />
                        <span class="col-span-4 text-xs text-slate-600">{{ p.unit || '' }} {{ p.reference ? '(' + p.reference + ')' : '' }}
                          @if (liveFlag(p) && liveFlag(p) !== 'NORMAL') { <b [class]="flagClass(liveFlag(p)!)">{{ liveFlag(p) }}</b> }</span>
                      </div>
                    }
                    <input [(ngModel)]="comment" maxlength="500" aria-label="Comment" placeholder="Comment (optional)" class="w-full border border-outline-variant rounded-lg p-2 text-sm" />
                    <div class="flex gap-2">
                      <button type="button" [id]="'save-results-' + i.id" (click)="saveResults(i)" [disabled]="busy || !draftReady(i)"
                        class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Save results</button>
                      <button type="button" (click)="editing = null" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
                    </div>
                  </div>
                } @else {
                  @if (i.results.length) {
                    <table class="w-full text-sm mt-2">
                      @for (r of i.results; track r.name) {
                        <tr class="border-b border-dashed">
                          <td class="py-1">{{ r.name }}</td>
                          <td class="py-1" [class]="r.flag ? flagClass(r.flag) : ''">{{ r.value }} {{ r.flag && r.flag !== 'NORMAL' ? '(' + r.flag.toLowerCase() + ')' : '' }}</td>
                          <td class="py-1 text-slate-600">{{ r.unit || '' }}</td>
                          <td class="py-1 text-slate-600">{{ r.reference || '' }}</td>
                        </tr>
                      }
                    </table>
                    @if (i.comment) { <p class="text-sm mt-1"><b>Comment:</b> {{ i.comment }}</p> }
                  }
                  <div class="flex gap-2 mt-2">
                    @if (canProcess && (i.status === 'COLLECTED' || i.status === 'RESULTED')) {
                      <button type="button" [id]="'enter-results-' + i.id" (click)="startResults(i)" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">
                        {{ i.status === 'RESULTED' ? 'Correct results' : 'Enter results' }}</button>
                    }
                    @if (canVerify && i.status === 'RESULTED') {
                      <button type="button" [id]="'verify-' + i.id" (click)="run(lab.verify(i.id), i.testName + ' verified')" class="px-3 min-h-touch rounded-lg bg-emerald-600 text-white text-sm font-semibold">Verify</button>
                    }
                  </div>
                }
              } @else {
                <p class="text-xs text-slate-600 mt-1">Results are for the clinical team.</p>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`.act { display: flex; align-items: center; gap: 0.25rem; padding: 0 1rem; min-height: 44px; border-radius: 0.5rem; color: white; font-size: 0.875rem; font-weight: 600; }`],
})
export class LabOrderComponent implements OnInit {
  readonly lab = inject(LabService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  o: OrderView | null = null;
  error = '';
  busy = false;
  editing: string | null = null;
  draft: Record<string, string> = {};
  comment = '';

  get canProcess(): boolean {
    return this.auth.can('LAB_PROCESS');
  }

  get canVerify(): boolean {
    return this.auth.can('LAB_VERIFY');
  }

  get canBill(): boolean {
    return this.auth.can('BILLING');
  }

  get canCancel(): boolean {
    return this.auth.can('LAB_ORDER') || this.auth.can('LAB_PROCESS');
  }

  get hasPending(): boolean {
    return !!this.o?.items.some((i) => i.status === 'PENDING');
  }

  get hasVerified(): boolean {
    return !!this.o?.items.some((i) => i.status === 'VERIFIED');
  }

  get statusLabel(): string {
    return ORDER_STATUS_LABEL[this.o!.status];
  }

  ngOnInit(): void {
    this.lab.get(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: (o) => (this.o = o),
      error: (err) => (this.error = err?.error?.message || 'The order could not be loaded.'),
    });
  }

  itemLine(i: ItemView): string {
    const parts = [this.money(i.priceInPaisa)];
    if (i.sampleNumber) parts.push(`sample ${i.sampleNumber}`);
    if (i.resultedBy) parts.push(`entered by ${i.resultedBy}`);
    if (i.verifiedBy) parts.push(`verified by ${i.verifiedBy}`);
    return parts.join(' · ');
  }

  itemBadge(i: ItemView): string {
    return {
      PENDING: 'bg-amber-100 text-amber-900',
      COLLECTED: 'bg-blue-100 text-blue-800',
      RESULTED: 'bg-violet-100 text-violet-800',
      VERIFIED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-slate-100 text-slate-600',
    }[i.status];
  }

  startResults(i: ItemView): void {
    this.editing = i.id;
    this.draft = {};
    for (const p of i.parameters) {
      this.draft[p.id] = i.results.find((r) => r.name === p.name)?.value ?? '';
    }
    this.comment = i.comment ?? '';
  }

  liveFlag(p: ParameterView): Flag | null {
    return flagOf(p, this.draft[p.id] ?? '');
  }

  flagClass(f: Flag): string {
    return FLAG_STYLE[f];
  }

  draftReady(i: ItemView): boolean {
    return i.parameters.some((p) => (this.draft[p.id] ?? '').trim());
  }

  saveResults(i: ItemView): void {
    const values = i.parameters.filter((p) => (this.draft[p.id] ?? '').trim()).map((p) => ({ parameterId: p.id, value: this.draft[p.id].trim() }));
    this.run(this.lab.results(i.id, values, this.comment.trim() || null), `${i.testName}: results saved`, () => (this.editing = null));
  }

  cancel(i: ItemView): void {
    const reason = window.prompt(`Why cancel ${i.testName}?`);
    if (!reason || !reason.trim()) return;
    this.run(this.lab.cancel(i.id, reason.trim()), `${i.testName} cancelled`);
  }

  report(): void {
    this.lab.report(this.o!.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toast.error('The report could not be opened.'),
    });
  }

  run(call: Observable<OrderView>, done: string, after?: () => void): void {
    if (this.busy) return;
    this.busy = true;
    call.subscribe({
      next: (o) => {
        this.busy = false;
        this.o = o;
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
    return formatMoney(paisa);
  }
}
