import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { RadiologyService } from '../../core/services/radiology.service';
import { AuthService } from '../../core/services/auth.service';
import { IMAGING_STATUS_LABEL, ImagingOrderSummary } from '../../core/models/radiology.model';

const STAGES = [
  { value: 'perform', label: 'To do' },
  { value: 'report', label: 'To report' },
  { value: 'done', label: 'Reported' },
  { value: '', label: 'All' },
];

/** Radiology's worklist: urgent first, then oldest. Radiographers start at what to do, radiologists at what to report. */
@Component({
  selector: 'app-radiology-worklist',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Radiology</h1>
          <p class="text-sm text-slate-600 mt-1">Urgent orders first. Tap an order to do the study or write the report.</p>
        </div>
        @if (canManage) {
          <a routerLink="studies" id="go-studies" class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">list</span> Study catalog
          </a>
        }
      </div>
      <div class="flex gap-2 overflow-x-auto pb-2" id="rad-stages">
        @for (s of stages; track s.value) {
          <button type="button" (click)="setStage(s.value)" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
            [class]="stage === s.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ s.label }}</button>
        }
      </div>
      <input [ngModel]="q" (ngModelChange)="search($event)" id="rad-search" aria-label="Search imaging orders" placeholder="Patient, number or order"
        class="w-full sm:w-96 border border-outline-variant rounded-lg p-2.5 text-sm my-3" />
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      } @else if (rows.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-slate-600" id="rad-empty">Nothing here.</div>
      } @else {
        <div class="space-y-2" id="rad-orders">
          @for (o of rows; track o.id) {
            <a [routerLink]="[o.id]" class="block bg-white rounded-xl border border-outline-variant p-3 border-l-4" [attr.data-order]="o.orderNumber"
              [style.border-left-color]="o.priority === 'URGENT' ? '#dc2626' : o.status === 'COMPLETED' ? '#059669' : '#7c3aed'">
              <div class="flex justify-between gap-2 flex-wrap">
                <p class="font-semibold">{{ o.patientName }} <span class="text-sm font-normal text-slate-600">{{ o.patientCode }}</span></p>
                <span class="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100">{{ label(o) }}</span>
              </div>
              <p class="text-sm text-slate-700">{{ o.studies.join(', ') }}</p>
              <p class="text-xs text-slate-600">{{ o.orderNumber }}{{ o.doctorName ? ' · Dr ' + o.doctorName : '' }} · {{ o.orderedAt | date: 'd MMM, h:mm a' }}</p>
              <div class="flex gap-1.5 mt-1 text-xs font-semibold flex-wrap">
                @if (o.priority === 'URGENT') { <span class="px-2 py-0.5 rounded-full bg-red-600 text-white">Urgent</span> }
                @if (o.inpatient) { <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Inpatient</span> }
                @if (o.nextScheduledAt) { <span class="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">At {{ o.nextScheduledAt | date: 'd MMM, h:mm a' }}</span> }
                @if (o.toReport) { <span class="px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">{{ o.toReport }} to report</span> }
              </div>
            </a>
          }
        </div>
        @if (!last) { <button type="button" (click)="load(page + 1)" class="mt-3 px-4 min-h-touch text-sm border border-outline-variant rounded-lg bg-white">Show more</button> }
      }
    </div>
  `,
})
export class RadiologyWorklistComponent implements OnInit {
  private radiology = inject(RadiologyService);
  private auth = inject(AuthService);

  readonly stages = STAGES;
  stage = '';
  q = '';
  rows: ImagingOrderSummary[] = [];
  page = 0;
  last = true;
  error = '';
  private typed = new Subject<string>();

  get canManage(): boolean {
    return this.auth.can('IMAGING_MANAGE');
  }

  ngOnInit(): void {
    if (this.auth.can('IMAGING_PERFORM')) this.stage = 'perform';
    else if (this.auth.can('IMAGING_REPORT')) this.stage = 'report';
    this.typed.pipe(debounceTime(300)).subscribe(() => this.load(0));
    this.load(0);
  }

  setStage(stage: string): void {
    this.stage = stage;
    this.load(0);
  }

  search(q: string): void {
    this.q = q;
    this.typed.next(q);
  }

  load(page: number): void {
    this.error = '';
    this.radiology.worklist(this.stage, this.q, page).subscribe({
      next: (p) => {
        this.rows = page === 0 ? p.content : [...this.rows, ...p.content];
        this.page = page;
        this.last = p.last;
      },
      error: (err) => (this.error = err?.error?.message || 'The imaging orders could not be loaded.'),
    });
  }

  label(o: ImagingOrderSummary): string {
    return IMAGING_STATUS_LABEL[o.status];
  }
}
