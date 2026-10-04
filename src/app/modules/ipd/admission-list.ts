import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { IpdService } from '../../core/services/ipd.service';
import { AdmissionSummary } from '../../core/models/ipd.model';

const STAGES = [
  { value: 'current', label: 'In hospital' },
  { value: 'advised', label: 'Discharge advised' },
  { value: 'discharged', label: 'Discharged' },
  { value: '', label: 'All' },
];

/** Admissions: who is in, whose discharge is advised (the billing desk's queue), and who has gone home. */
@Component({
  selector: 'app-admission-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Admissions</h1>
          <p class="text-sm text-slate-600 mt-1">Inpatients from admission to discharge.</p>
        </div>
        <a routerLink=".." class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white flex items-center gap-1">
          <span class="material-symbols-outlined text-lg">bed</span> Bed board
        </a>
      </div>

      <div class="flex gap-2 overflow-x-auto pb-2" id="admission-stages">
        @for (s of stages; track s.value) {
          <button type="button" (click)="setStage(s.value)" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
            [class]="stage === s.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ s.label }}</button>
        }
      </div>
      <input [ngModel]="q" (ngModelChange)="search($event)" id="admission-search" aria-label="Search admissions"
        class="w-full sm:w-96 border border-outline-variant rounded-lg p-2.5 text-sm my-3" placeholder="Patient name, number or IP number" />

      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      } @else if (loading && rows.length === 0) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else if (rows.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-slate-600" id="no-admissions">
          Nobody here.
        </div>
      } @else {
        <div class="space-y-2" id="admissions">
          @for (a of rows; track a.id) {
            <a [routerLink]="a.id" class="block bg-white rounded-xl border border-outline-variant p-3 border-l-4 hover:bg-surface-container-low"
              [style.border-left-color]="colour(a)" [attr.data-admission]="a.admissionNumber">
              <div class="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p class="font-semibold text-on-surface">{{ a.patientName }} <span class="text-sm font-normal text-slate-600">{{ a.patientCode }}</span></p>
                  <p class="text-sm text-slate-600">{{ a.admissionNumber }} · {{ a.doctorName }}</p>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full" [class]="badge(a)">{{ statusLabel(a) }}</span>
              </div>
              <p class="text-sm text-slate-700 mt-1">
                @if (a.bedNumber) { {{ a.wardName }}, bed {{ a.bedNumber }} · }
                Admitted {{ a.admittedAt | date: 'd MMM, h:mm a' }} · {{ a.days }} {{ a.days === 1 ? 'day' : 'days' }}
                @if (a.dischargedAt) { · went home {{ a.dischargedAt | date: 'd MMM' }} }
              </p>
            </a>
          }
        </div>
        @if (!last) {
          <button type="button" (click)="more()" class="mt-3 px-4 min-h-touch text-sm border border-outline-variant rounded-lg bg-white">Show more</button>
        }
      }
    </div>
  `,
})
export class AdmissionListComponent implements OnInit {
  private ipd = inject(IpdService);

  readonly stages = STAGES;
  stage = 'current';
  q = '';
  rows: AdmissionSummary[] = [];
  page = 0;
  last = true;
  loading = false;
  error = '';
  private typed = new Subject<string>();

  ngOnInit(): void {
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

  more(): void {
    this.load(this.page + 1);
  }

  load(page: number): void {
    this.loading = true;
    this.error = '';
    this.ipd.admissions(this.stage, this.q, page).subscribe({
      next: (p) => {
        this.rows = page === 0 ? p.content : [...this.rows, ...p.content];
        this.page = page;
        this.last = p.last;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'The admissions could not be loaded.';
      },
    });
  }

  statusLabel(a: AdmissionSummary): string {
    return { ADMITTED: 'In hospital', DISCHARGE_ADVISED: 'Discharge advised', DISCHARGED: 'Discharged' }[a.status];
  }

  badge(a: AdmissionSummary): string {
    return {
      ADMITTED: 'bg-blue-100 text-blue-800',
      DISCHARGE_ADVISED: 'bg-violet-100 text-violet-800',
      DISCHARGED: 'bg-slate-100 text-slate-700',
    }[a.status];
  }

  colour(a: AdmissionSummary): string {
    return { ADMITTED: '#2563eb', DISCHARGE_ADVISED: '#7c3aed', DISCHARGED: '#94a3b8' }[a.status];
  }
}
