import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { RadiologyService } from '../../core/services/radiology.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { IMAGING_STATUS_LABEL, ImagingItemView, ImagingOrderView, modalityLabel } from '../../core/models/radiology.model';
import { formatMoney } from '../../core/utils/money';

type Mode = 'schedule' | 'done' | 'report' | 'addendum';

/**
 * One imaging order: the radiographer gives a time and does each study (linking the images, and the Form F number
 * for an obstetric scan); the radiologist writes and signs the report; later notes are an addendum. The desk bills
 * an outpatient's studies here.
 */
@Component({
  selector: 'app-radiology-order',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Radiology</a>
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="rad-order-error">{{ error }}</div>
      } @else if (!o) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant p-4 border-l-4 mb-3" [style.border-left-color]="o.priority === 'URGENT' ? '#dc2626' : '#7c3aed'" id="rad-order-header">
          <div class="flex justify-between gap-2 flex-wrap">
            <h1 class="text-xl font-semibold">{{ o.patientName }} <span class="text-sm font-normal text-slate-600">{{ o.patientCode }}{{ o.patientAge !== null ? ' · ' + o.patientAge + ' y' : '' }}{{ o.patientGender ? ' · ' + o.patientGender.toLowerCase() : '' }}</span></h1>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100" id="rad-order-status">{{ statusLabel }}</span>
          </div>
          <p class="text-sm text-slate-700">{{ o.orderNumber }}{{ o.priority === 'URGENT' ? ' · URGENT' : '' }}{{ o.doctorName ? ' · Dr ' + o.doctorName : '' }}
            {{ o.admissionNumber ? ' · inpatient ' + o.admissionNumber : '' }} · {{ o.orderedAt | date: 'd MMM, h:mm a' }}</p>
          @if (o.clinicalNote) { <p class="text-sm mt-1"><b>Clinical details:</b> {{ o.clinicalNote }}</p> }
          @if (o.billNumber) { <p class="text-sm mt-1">Billed: {{ o.billNumber }}</p> }
        </div>

        <div class="flex gap-2 flex-wrap mb-3" id="rad-actions">
          @if (canBill && !o.admissionId && !o.billId && o.status !== 'CANCELLED') {
            <button type="button" id="rad-bill" (click)="run(radiology.bill(o.id), 'Bill made')" class="act bg-orange-600"><span class="material-symbols-outlined text-lg">receipt_long</span> Bill {{ money(o.totalInPaisa) }}</button>
          }
          @if (o.billId && canBill) {
            <a [routerLink]="['../../billing', o.billId]" class="act bg-slate-600"><span class="material-symbols-outlined text-lg">request_quote</span> Bill {{ o.billNumber }}</a>
          }
          @if (o.reports && hasReported) {
            <button type="button" id="rad-print" (click)="print()" class="act bg-indigo-600"><span class="material-symbols-outlined text-lg">print</span> Report</button>
          }
        </div>

        <div class="space-y-3" id="rad-items">
          @for (i of o.items; track i.id) {
            <section class="bg-white rounded-xl border border-outline-variant p-3" [attr.data-item]="i.studyName">
              <div class="flex justify-between gap-2 flex-wrap items-start">
                <div>
                  <h2 class="font-semibold">{{ i.studyName }} <span class="text-xs font-normal text-slate-600">{{ modality(i) }}</span></h2>
                  <p class="text-xs text-slate-600">{{ itemLine(i) }}</p>
                  @if (i.preparation && i.status === 'ORDERED') { <p class="text-xs text-amber-800 mt-0.5">Preparation: {{ i.preparation }}</p> }
                </div>
                <div class="flex gap-2 items-center">
                  <span class="text-xs font-semibold px-2 py-1 rounded-full" [class]="badge(i)" [attr.data-status]="i.status">{{ i.status.toLowerCase() }}</span>
                  @if (canCancel && i.status === 'ORDERED') {
                    <button type="button" (click)="cancel(i)" class="text-xs text-status-red underline" [attr.aria-label]="'Cancel ' + i.studyName">Cancel</button>
                  }
                </div>
              </div>

              @if (o.reports && i.imageLink) {
                <a [href]="i.imageLink" target="_blank" rel="noopener" class="text-sm text-primary underline mt-1 inline-flex items-center gap-1" [attr.data-images]="i.studyName">
                  <span class="material-symbols-outlined text-base">image</span> Open images</a>
              }
              @if (o.reports && i.technicianNote) { <p class="text-sm mt-1"><b>Radiographer:</b> {{ i.technicianNote }}</p> }
              @if (o.reports && i.findings) {
                <div class="mt-2 text-sm" [attr.data-report]="i.studyName">
                  <p class="font-semibold">Findings</p>
                  <p class="whitespace-pre-line">{{ i.findings }}</p>
                  <p class="font-semibold mt-1">Impression</p>
                  <p class="whitespace-pre-line font-medium">{{ i.impression }}</p>
                  <p class="text-xs text-slate-600 mt-1">Signed by {{ i.reportedBy }} · {{ i.reportedAt | date: 'd MMM, h:mm a' }}</p>
                  @if (i.addendum) { <p class="mt-1 whitespace-pre-line p-2 rounded bg-amber-50"><b>Addendum</b>&#10;{{ i.addendum }}</p> }
                </div>
              }
              @if (!o.reports && i.status === 'REPORTED') { <p class="text-xs text-slate-600 mt-1">The report is for the clinical team.</p> }

              @if (open?.id === i.id) {
                <div class="mt-2 space-y-2 p-2 rounded-lg bg-slate-50" [attr.data-form]="mode">
                  @switch (mode) {
                    @case ('schedule') {
                      <input type="datetime-local" [(ngModel)]="when" aria-label="Time for the study" class="border border-outline-variant rounded-lg p-2 text-sm" />
                    }
                    @case ('done') {
                      @if (i.formFRequired) {
                        <input [(ngModel)]="formF" maxlength="40" id="form-f" aria-label="Form F number" placeholder="Form F number (PCPNDT)" class="w-full border border-amber-400 rounded-lg p-2 text-sm" />
                      }
                      <input [(ngModel)]="link" maxlength="500" id="image-link" aria-label="Image link" placeholder="Link to the images (PACS), optional" class="w-full border border-outline-variant rounded-lg p-2 text-sm" />
                      <input [(ngModel)]="note" maxlength="500" aria-label="Note for the radiologist" placeholder="Note for the radiologist, optional" class="w-full border border-outline-variant rounded-lg p-2 text-sm" />
                    }
                    @case ('report') {
                      <textarea [(ngModel)]="findings" maxlength="4000" rows="6" id="findings" aria-label="Findings" placeholder="Findings" class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
                      <textarea [(ngModel)]="impression" maxlength="1000" rows="2" id="impression" aria-label="Impression" placeholder="Impression" class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
                      <p class="text-xs text-slate-600">Signing makes the report final; anything later goes in an addendum.</p>
                    }
                    @case ('addendum') {
                      <textarea [(ngModel)]="addendumText" maxlength="1000" rows="3" id="addendum" aria-label="Addendum" placeholder="Addendum" class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
                    }
                  }
                  <div class="flex gap-2">
                    <button type="button" id="rad-save" (click)="save(i)" [disabled]="busy || !ready"
                      class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">{{ saveLabel }}</button>
                    <button type="button" (click)="open = null" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
                  </div>
                </div>
              } @else {
                <div class="flex gap-2 mt-2 flex-wrap">
                  @if (canPerform && i.status === 'ORDERED') {
                    <button type="button" [id]="'schedule-' + i.id" (click)="start(i, 'schedule')" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">{{ i.scheduledAt ? 'Change time' : 'Give a time' }}</button>
                    <button type="button" [id]="'done-' + i.id" (click)="start(i, 'done')" class="px-3 min-h-touch rounded-lg bg-teal-600 text-white text-sm font-semibold">Mark done</button>
                  }
                  @if (canReport && i.status === 'DONE') {
                    <button type="button" [id]="'report-' + i.id" (click)="start(i, 'report')" class="px-3 min-h-touch rounded-lg bg-violet-600 text-white text-sm font-semibold">Write report</button>
                  }
                  @if (canReport && i.status === 'REPORTED') {
                    <button type="button" [id]="'addendum-' + i.id" (click)="start(i, 'addendum')" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">Add addendum</button>
                  }
                </div>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [`.act { display: flex; align-items: center; gap: 0.25rem; padding: 0 1rem; min-height: 44px; border-radius: 0.5rem; color: white; font-size: 0.875rem; font-weight: 600; }`],
})
export class RadiologyOrderComponent implements OnInit {
  readonly radiology = inject(RadiologyService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  o: ImagingOrderView | null = null;
  error = '';
  busy = false;
  open: ImagingItemView | null = null;
  mode: Mode = 'done';
  when = '';
  link = '';
  note = '';
  formF = '';
  findings = '';
  impression = '';
  addendumText = '';

  get canPerform(): boolean {
    return this.auth.can('IMAGING_PERFORM');
  }

  get canReport(): boolean {
    return this.auth.can('IMAGING_REPORT');
  }

  get canBill(): boolean {
    return this.auth.can('BILLING');
  }

  get canCancel(): boolean {
    return this.auth.can('IMAGING_ORDER') || this.auth.can('IMAGING_PERFORM');
  }

  get hasReported(): boolean {
    return !!this.o?.items.some((i) => i.status === 'REPORTED');
  }

  get statusLabel(): string {
    return IMAGING_STATUS_LABEL[this.o!.status];
  }

  get ready(): boolean {
    switch (this.mode) {
      case 'done':
        return !this.open?.formFRequired || this.formF.trim().length > 0;
      case 'report':
        return this.findings.trim().length > 0 && this.impression.trim().length > 0;
      case 'addendum':
        return this.addendumText.trim().length > 0;
      default:
        return true;
    }
  }

  get saveLabel(): string {
    return { schedule: 'Save time', done: 'Study done', report: 'Sign report', addendum: 'Add addendum' }[this.mode];
  }

  ngOnInit(): void {
    this.radiology.get(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: (o) => (this.o = o),
      error: (err) => (this.error = err?.error?.message || 'The order could not be loaded.'),
    });
  }

  modality(i: ImagingItemView): string {
    return modalityLabel(i.modality);
  }

  itemLine(i: ImagingItemView): string {
    const parts = [this.money(i.priceInPaisa)];
    if (i.status === 'ORDERED' && i.scheduledAt) parts.push(`at ${new Date(i.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`);
    if (i.performedBy) parts.push(`done by ${i.performedBy}`);
    if (i.formFNumber) parts.push(`Form F ${i.formFNumber}`);
    if (i.status === 'CANCELLED' && i.comment) parts.push(`cancelled: ${i.comment}`);
    return parts.join(' · ');
  }

  badge(i: ImagingItemView): string {
    return {
      ORDERED: 'bg-amber-100 text-amber-900',
      DONE: 'bg-blue-100 text-blue-800',
      REPORTED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-slate-100 text-slate-600',
    }[i.status];
  }

  start(i: ImagingItemView, mode: Mode): void {
    this.open = i;
    this.mode = mode;
    this.when = i.scheduledAt ? i.scheduledAt.slice(0, 16) : '';
    this.link = '';
    this.note = '';
    this.formF = '';
    this.findings = '';
    this.impression = '';
    this.addendumText = '';
  }

  save(i: ImagingItemView): void {
    const close = () => (this.open = null);
    switch (this.mode) {
      case 'schedule':
        this.run(this.radiology.schedule(i.id, this.when ? this.when + ':00' : null), 'Time saved', close);
        break;
      case 'done':
        this.run(this.radiology.done(i.id, this.link.trim() || null, this.note.trim() || null, this.formF.trim() || null),
          `${i.studyName} done`, close);
        break;
      case 'report':
        this.run(this.radiology.report(i.id, this.findings.trim(), this.impression.trim()), 'Report signed', close);
        break;
      case 'addendum':
        this.run(this.radiology.addendum(i.id, this.addendumText.trim()), 'Addendum added', close);
        break;
    }
  }

  cancel(i: ImagingItemView): void {
    const reason = window.prompt(`Why cancel ${i.studyName}?`);
    if (!reason || !reason.trim()) return;
    this.run(this.radiology.cancel(i.id, reason.trim()), `${i.studyName} cancelled`);
  }

  print(): void {
    this.radiology.reportPdf(this.o!.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toast.error('The report could not be opened.'),
    });
  }

  run(call: Observable<ImagingOrderView>, done: string, after?: () => void): void {
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
