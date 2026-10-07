import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Analytics, AnalyticsService } from '../../core/services/analytics.service';
import { formatMoney } from '../../core/utils/money';

const SOURCE_LABEL: Record<string, string> = {
  OPD: 'Outpatient', INPATIENT: 'Inpatient stays', LAB: 'Lab', RADIOLOGY: 'Radiology', SURGERY: 'Day-case surgery',
};
const SOURCE_COLOUR: Record<string, string> = {
  OPD: 'bg-sky-500', INPATIENT: 'bg-indigo-500', LAB: 'bg-teal-500', RADIOLOGY: 'bg-violet-500', SURGERY: 'bg-rose-500',
};

/**
 * Hospital analytics: a period in one tap, then the headline numbers as coloured tiles, revenue by source, a daily
 * trend, and the lab, radiology, theatre and insurance cards for the modules the hospital has.
 */
@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl">
      <h1 class="text-2xl font-semibold text-on-surface">Analytics</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">How the hospital is doing over a period.</p>
      <div class="flex gap-2 flex-wrap items-center mb-4" id="an-periods">
        @for (p of periods; track p.days) {
          <button type="button" (click)="last(p.days)" class="px-3 min-h-touch rounded-full text-sm border"
            [class]="chosen === p.days ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ p.label }}</button>
        }
        <input type="date" [(ngModel)]="from" (change)="custom()" aria-label="From" class="border border-outline-variant rounded-lg p-2 text-sm" />
        <input type="date" [(ngModel)]="to" (change)="custom()" aria-label="To" class="border border-outline-variant rounded-lg p-2 text-sm" />
      </div>

      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="an-error">{{ error }}</div>
      } @else if (a) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4" id="an-tiles">
          @if (a.revenue) {
            <div class="rounded-xl p-4 bg-emerald-600 text-white"><p class="text-xs opacity-90">Billed</p><p class="text-2xl font-bold" id="an-billed">{{ money(a.revenue.billedInPaisa) }}</p><p class="text-xs opacity-90">{{ a.revenue.bills }} bills</p></div>
          }
          @if (a.beds) {
            <div class="rounded-xl p-4 bg-indigo-600 text-white"><p class="text-xs opacity-90">Bed occupancy</p><p class="text-2xl font-bold" id="an-occupancy">{{ a.beds.occupancyPercent }}%</p><p class="text-xs opacity-90">{{ a.beds.occupiedNow }} of {{ a.beds.beds }} beds in use now</p></div>
            <div class="rounded-xl p-4 bg-sky-600 text-white"><p class="text-xs opacity-90">Admissions · discharges</p><p class="text-2xl font-bold" id="an-admissions">{{ a.beds.admissions }} · {{ a.beds.discharges }}</p><p class="text-xs opacity-90">Average stay {{ a.beds.averageStayDays }} days</p></div>
          }
          @if (a.theatre) {
            <div class="rounded-xl p-4 bg-rose-600 text-white"><p class="text-xs opacity-90">Surgeries done</p><p class="text-2xl font-bold" id="an-surgeries">{{ a.theatre.completed }}</p><p class="text-xs opacity-90">Theatres {{ a.theatre.utilisationPercent }}% used</p></div>
          }
        </div>

        @if (a.revenue) {
          <section class="bg-white rounded-xl border border-outline-variant p-4 mb-4" id="an-sources">
            <h2 class="font-semibold mb-2">Revenue by source</h2>
            @for (s of a.revenue.bySource; track s.source) {
              <div class="mb-2" [attr.data-source]="s.source">
                <div class="flex justify-between text-sm"><span>{{ sourceLabel(s.source) }} · {{ s.bills }}</span><b>{{ money(s.amountInPaisa) }}</b></div>
                <div class="h-2.5 rounded-full bg-slate-100"><div class="h-2.5 rounded-full" [class]="sourceColour(s.source)" [style.width.%]="share(s.amountInPaisa)"></div></div>
              </div>
            }
          </section>
        }

        <section class="bg-white rounded-xl border border-outline-variant p-4 mb-4" id="an-daily">
          <h2 class="font-semibold mb-2">Day by day</h2>
          <div class="flex items-end gap-0.5 h-32 overflow-x-auto">
            @for (d of a.daily; track d.date) {
              <div class="flex-1 min-w-[6px] flex flex-col justify-end h-full" [title]="dayTitle(d)">
                <div class="rounded-t" [class]="a.revenue ? 'bg-emerald-500' : 'bg-indigo-500'" [style.height.%]="dayHeight(d)"></div>
              </div>
            }
          </div>
          <p class="text-xs text-slate-600 mt-1">{{ a.revenue ? 'Billed each day' : 'Admissions each day' }} · {{ a.from | date: 'd MMM' }} to {{ a.to | date: 'd MMM y' }}</p>
        </section>

        <div class="grid md:grid-cols-2 gap-3">
          @if (a.lab) {
            <section class="bg-white rounded-xl border-l-4 border-teal-500 border border-outline-variant p-4" id="an-lab">
              <h2 class="font-semibold">Lab</h2>
              <p class="text-sm">{{ a.lab.tests }} tests on {{ a.lab.orders }} orders · {{ a.lab.verified }} verified</p>
              <p class="text-sm">Turnaround {{ a.lab.averageTurnaroundHours ?? '–' }} h · out of range {{ a.lab.abnormalPercent ?? '–' }}%</p>
            </section>
          }
          @if (a.radiology) {
            <section class="bg-white rounded-xl border-l-4 border-violet-500 border border-outline-variant p-4" id="an-radiology">
              <h2 class="font-semibold">Radiology</h2>
              <p class="text-sm">{{ a.radiology.studies }} studies · {{ a.radiology.reported }} reported · report in {{ a.radiology.averageReportHours ?? '–' }} h</p>
              <p class="text-xs text-slate-600">{{ entries(a.radiology.byModality) }}</p>
            </section>
          }
          @if (a.theatre) {
            <section class="bg-white rounded-xl border-l-4 border-rose-500 border border-outline-variant p-4" id="an-theatre">
              <h2 class="font-semibold">Operation theatre</h2>
              <p class="text-sm">{{ a.theatre.booked }} booked · {{ a.theatre.completed }} done · {{ a.theatre.cancelled }} cancelled · {{ a.theatre.emergencies }} emergencies</p>
              <p class="text-sm">{{ a.theatre.hoursInSurgery }} hours in surgery</p>
            </section>
          }
          @if (a.insurance) {
            <section class="bg-white rounded-xl border-l-4 border-amber-500 border border-outline-variant p-4" id="an-insurance">
              <h2 class="font-semibold">Insurance</h2>
              <p class="text-sm">{{ a.insurance.claims }} claims{{ a.insurance.claimedInPaisa !== null ? ' · claimed ' + money(a.insurance.claimedInPaisa) + ' · settled ' + money(a.insurance.settledInPaisa ?? 0) : '' }}</p>
              <p class="text-xs text-slate-600">{{ entries(a.insurance.byStatus) }}</p>
            </section>
          }
          @if (a.beds && typeEntries(a.beds.admissionsByType)) {
            <section class="bg-white rounded-xl border-l-4 border-indigo-500 border border-outline-variant p-4" id="an-types">
              <h2 class="font-semibold">Admissions by type</h2>
              <p class="text-sm">{{ typeEntries(a.beds.admissionsByType) }}</p>
            </section>
          }
        </div>
      } @else {
        <p class="text-sm text-slate-600">Loading…</p>
      }
    </div>
  `,
})
export class AnalyticsPageComponent implements OnInit {
  private analytics = inject(AnalyticsService);

  readonly periods = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
    { label: '1 year', days: 365 },
  ];
  chosen: number | null = 30;
  from = '';
  to = '';
  a: Analytics | null = null;
  error = '';

  ngOnInit(): void {
    this.last(30);
  }

  last(days: number): void {
    this.chosen = days;
    const end = new Date();
    this.to = AnalyticsPageComponent.iso(end);
    this.from = AnalyticsPageComponent.iso(new Date(end.getTime() - (days - 1) * 86_400_000));
    this.load();
  }

  custom(): void {
    if (!this.from || !this.to) return;
    this.chosen = null;
    this.load();
  }

  load(): void {
    this.error = '';
    this.analytics.get(this.from, this.to).subscribe({
      next: (a) => (this.a = a),
      error: (err) => (this.error = err?.error?.message || 'The numbers could not be loaded.'),
    });
  }

  share(amount: number): number {
    const total = this.a?.revenue?.billedInPaisa ?? 0;
    return total ? Math.round((100 * amount) / total) : 0;
  }

  dayHeight(d: Analytics['daily'][number]): number {
    const values = (this.a?.daily ?? []).map((x) => (this.a?.revenue ? x.billedInPaisa ?? 0 : x.admissions));
    const max = Math.max(1, ...values);
    const v = this.a?.revenue ? d.billedInPaisa ?? 0 : d.admissions;
    return Math.round((100 * v) / max);
  }

  dayTitle(d: Analytics['daily'][number]): string {
    return `${d.date}: ${d.admissions} admitted, ${d.discharges} discharged, ${d.surgeries} surgeries`
      + (d.billedInPaisa !== null ? `, ${this.money(d.billedInPaisa)} billed` : '');
  }

  sourceLabel(s: string): string {
    return SOURCE_LABEL[s] ?? s;
  }

  sourceColour(s: string): string {
    return SOURCE_COLOUR[s] ?? 'bg-slate-500';
  }

  entries(m: Record<string, number>): string {
    return Object.entries(m).map(([k, v]) => `${k.replace(/_/g, ' ').toLowerCase()} ${v}`).join(' · ');
  }

  typeEntries(m: Record<string, number>): string {
    return this.entries(m);
  }

  money(paisa: number): string {
    return formatMoney(paisa);
  }

  static iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
