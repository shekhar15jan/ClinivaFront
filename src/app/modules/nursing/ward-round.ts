import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NursingService } from '../../core/services/nursing.service';
import { RoundItem } from '../../core/models/nursing.model';

/**
 * The ward round, on the nurse's phone: every patient in a bed (within their care), most urgent first. Red is a dose
 * overdue or a reading out of range, blue a dose due now, amber vitals due. Tap a patient to chart.
 */
@Component({
  selector: 'app-ward-round',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Ward round</h1>
          <p class="text-sm text-slate-600 mt-1">Most urgent first. Tap a patient to give doses, record vitals or write a note.</p>
        </div>
        <button type="button" (click)="load()" aria-label="Refresh" class="p-2 rounded-lg border border-outline-variant bg-white">
          <span class="material-symbols-outlined">refresh</span>
        </button>
      </div>

      @if (wards.length > 1) {
        <div class="flex gap-2 overflow-x-auto pb-2 mb-2" id="round-wards">
          <button type="button" (click)="ward = ''" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
            [class]="ward === '' ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">All</button>
          @for (w of wards; track w.id) {
            <button type="button" (click)="ward = w.id" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
              [class]="ward === w.id ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ w.name }}</button>
          }
        </div>
      }

      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="round-error">{{ error }}</div>
      } @else if (loading && items.length === 0) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else if (shown.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-slate-600" id="round-empty">
          No patients in beds under your care.
        </div>
      } @else {
        <div class="space-y-2" id="round">
          @for (r of shown; track r.admissionId) {
            <a [routerLink]="[r.admissionId]" class="block bg-white rounded-xl border border-outline-variant p-3 border-l-4"
              [style.border-left-color]="colour(r)" [attr.data-patient]="r.patientName">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-semibold text-on-surface truncate">{{ r.patientName }}</p>
                  <p class="text-sm text-slate-600">{{ r.wardName }}, bed {{ r.bedNumber }} · Dr {{ r.doctorName }}</p>
                </div>
                @if (r.dischargeAdvised) { <span class="text-xs font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-800">Going home</span> }
              </div>
              <div class="flex gap-1.5 flex-wrap mt-2 text-xs font-semibold">
                @if (r.dosesOverdue) { <span class="px-2 py-1 rounded-full bg-red-600 text-white">{{ r.dosesOverdue }} overdue</span> }
                @if (r.dosesDue) { <span class="px-2 py-1 rounded-full bg-blue-600 text-white">{{ r.dosesDue }} due now</span> }
                @if (!r.dosesOverdue && !r.dosesDue && r.nextDoseAt) {
                  <span class="px-2 py-1 rounded-full bg-slate-100 text-slate-700">Next dose {{ r.nextDoseAt | date: 'h:mm a' }}</span>
                }
                @if (r.vitalsOverdue) { <span class="px-2 py-1 rounded-full bg-amber-100 text-amber-900">Vitals due</span> }
                @for (f of r.flags; track f) { <span class="px-2 py-1 rounded-full bg-red-50 text-red-800 border border-red-200">{{ f }}</span> }
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class WardRoundComponent implements OnInit {
  private nursing = inject(NursingService);

  items: RoundItem[] = [];
  ward = '';
  loading = false;
  error = '';

  get wards(): { id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const r of this.items) if (r.wardId && r.wardName) seen.set(r.wardId, r.wardName);
    return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  get shown(): RoundItem[] {
    return this.items.filter((r) => !this.ward || r.wardId === this.ward);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.nursing.round().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'The round could not be loaded.';
      },
    });
  }

  colour(r: RoundItem): string {
    if (r.dosesOverdue || r.flags.length) return '#dc2626';
    if (r.dosesDue) return '#2563eb';
    if (r.vitalsOverdue) return '#d97706';
    return '#059669';
  }
}
