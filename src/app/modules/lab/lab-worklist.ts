import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { LabService } from '../../core/services/lab.service';
import { AuthService } from '../../core/services/auth.service';
import { ORDER_STATUS_LABEL, OrderSummary } from '../../core/models/lab.model';

const STAGES = [
  { value: 'collect', label: 'To collect' },
  { value: 'process', label: 'In the lab' },
  { value: 'done', label: 'Reported' },
  { value: '', label: 'All' },
];

/** The lab's worklist: urgent first, then oldest; abnormal results counted on each order. */
@Component({
  selector: 'app-lab-worklist',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Lab</h1>
          <p class="text-sm text-slate-600 mt-1">Urgent orders first. Tap an order to collect, enter results or verify.</p>
        </div>
        @if (canManage) {
          <a routerLink="tests" id="go-lab-tests" class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">list</span> Test catalog
          </a>
        }
      </div>
      <div class="flex gap-2 overflow-x-auto pb-2" id="lab-stages">
        @for (s of stages; track s.value) {
          <button type="button" (click)="setStage(s.value)" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
            [class]="stage === s.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ s.label }}</button>
        }
      </div>
      <input [ngModel]="q" (ngModelChange)="search($event)" id="lab-search" aria-label="Search lab orders" placeholder="Patient, number or order"
        class="w-full sm:w-96 border border-outline-variant rounded-lg p-2.5 text-sm my-3" />
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      } @else if (rows.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-slate-600" id="lab-empty">Nothing here.</div>
      } @else {
        <div class="space-y-2" id="lab-orders">
          @for (o of rows; track o.id) {
            <a [routerLink]="[o.id]" class="block bg-white rounded-xl border border-outline-variant p-3 border-l-4" [attr.data-order]="o.orderNumber"
              [style.border-left-color]="o.priority === 'URGENT' ? '#dc2626' : o.status === 'COMPLETED' ? '#059669' : '#2563eb'">
              <div class="flex justify-between gap-2 flex-wrap">
                <p class="font-semibold">{{ o.patientName }} <span class="text-sm font-normal text-slate-600">{{ o.patientCode }}</span></p>
                <span class="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100">{{ statusLabel(o) }}</span>
              </div>
              <p class="text-sm text-slate-700">{{ o.orderNumber }} · {{ o.tests }} {{ o.tests === 1 ? 'test' : 'tests' }}{{ o.doctorName ? ' · Dr ' + o.doctorName : '' }}
                · {{ o.orderedAt | date: 'd MMM, h:mm a' }}</p>
              <div class="flex gap-1.5 mt-1 text-xs font-semibold">
                @if (o.priority === 'URGENT') { <span class="px-2 py-0.5 rounded-full bg-red-600 text-white">Urgent</span> }
                @if (o.inpatient) { <span class="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Inpatient</span> }
                @if (o.abnormal) { <span class="px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">{{ o.abnormal }} out of range</span> }
              </div>
            </a>
          }
        </div>
        @if (!last) { <button type="button" (click)="load(page + 1)" class="mt-3 px-4 min-h-touch text-sm border border-outline-variant rounded-lg bg-white">Show more</button> }
      }
    </div>
  `,
})
export class LabWorklistComponent implements OnInit {
  private lab = inject(LabService);
  private auth = inject(AuthService);

  readonly stages = STAGES;
  stage = 'collect';
  q = '';
  rows: OrderSummary[] = [];
  page = 0;
  last = true;
  error = '';
  private typed = new Subject<string>();

  get canManage(): boolean {
    return this.auth.can('LAB_MANAGE');
  }

  ngOnInit(): void {
    // The lab starts at what to collect; doctors and the desk at everything.
    if (!this.auth.can('LAB_PROCESS')) this.stage = '';
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
    this.lab.worklist(this.stage, this.q, page).subscribe({
      next: (p) => {
        this.rows = page === 0 ? p.content : [...this.rows, ...p.content];
        this.page = page;
        this.last = p.last;
      },
      error: (err) => (this.error = err?.error?.message || 'The lab orders could not be loaded.'),
    });
  }

  statusLabel(o: OrderSummary): string {
    return ORDER_STATUS_LABEL[o.status];
  }
}
