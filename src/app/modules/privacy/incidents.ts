import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse } from '../../core/models/common.model';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/toast/toast.service';

export type IncidentCategory = 'UNAUTHORISED_ACCESS' | 'LOST_OR_STOLEN_DEVICE' | 'SENT_TO_WRONG_PERSON' | 'CYBER_ATTACK'
  | 'SYSTEM_FAULT' | 'PAPER_RECORDS' | 'OTHER';

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  category: IncidentCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  occurredAt: string | null;
  discoveredAt: string;
  containedAt: string | null;
  affectedCount: number;
  dataKinds: string | null;
  actions: string | null;
  status: 'OPEN' | 'CONTAINED' | 'CLOSED';
  regulatorDueAt: string;
  regulatorNotifiedAt: string | null;
  regulatorReference: string | null;
  individualsDueAt: string;
  individualsNotifiedAt: string | null;
  notNotifiableReason: string | null;
  regulatorOverdue: boolean;
  individualsOverdue: boolean;
  closedAt: string | null;
}

export const CATEGORIES: { code: IncidentCategory; label: string }[] = [
  { code: 'UNAUTHORISED_ACCESS', label: 'Someone saw data they should not' },
  { code: 'LOST_OR_STOLEN_DEVICE', label: 'Lost or stolen phone, laptop or drive' },
  { code: 'SENT_TO_WRONG_PERSON', label: 'Sent to the wrong person' },
  { code: 'CYBER_ATTACK', label: 'Hacking, ransomware or phishing' },
  { code: 'SYSTEM_FAULT', label: 'A system fault exposed data' },
  { code: 'PAPER_RECORDS', label: 'Paper records lost or seen' },
  { code: 'OTHER', label: 'Something else' },
];

/** "now" as the value a datetime-local input takes (local time, to the minute). */
export function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/**
 * The breach register: every breach, notifiable or not, with its two deadlines (the regulator 72 hours after
 * discovery; the people affected at the latest 60 days) and what was done. Closing needs containment and each
 * notice given, or the reason none was needed.
 */
@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="bg-white rounded-xl border border-outline-variant p-4 mb-4" id="incidents">
      <div class="flex flex-wrap justify-between items-center gap-2 mb-1">
        <h2 class="font-semibold">Data breaches</h2>
        <button type="button" id="incident-new" (click)="adding = !adding" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">
          {{ adding ? 'Cancel' : 'Record a breach' }}</button>
      </div>
      <p class="text-xs text-slate-600 mb-3">Record every breach. Tell the regulator within 72 hours of finding it (India's Data Protection Board,
        EU and UK authorities, SDAIA, the UAE Data Office) and the people affected without delay, at the latest 60 days (HIPAA).
        Singapore: assess within 30 days, then tell the PDPC within 3 days.
        India: a cyber incident (hacking, ransomware, unauthorised access) also goes to CERT-In within 6 hours.</p>

      @if (adding) {
        <div class="rounded-lg bg-slate-50 p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" id="incident-form">
          <label class="block font-medium sm:col-span-2">What happened
            <input [(ngModel)]="title" id="incident-title" maxlength="200" class="mt-1 block w-full border border-outline-variant rounded-lg p-2" /></label>
          <label class="block font-medium">Kind
            <select [(ngModel)]="category" id="incident-category" class="mt-1 block w-full border border-outline-variant rounded-lg p-2 bg-white">
              @for (c of categories; track c.code) { <option [value]="c.code">{{ c.label }}</option> }
            </select></label>
          <label class="block font-medium">Severity
            <select [(ngModel)]="severity" id="incident-severity" class="mt-1 block w-full border border-outline-variant rounded-lg p-2 bg-white">
              <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
            </select></label>
          <label class="block font-medium">Found on
            <input type="datetime-local" [(ngModel)]="discoveredAt" id="incident-discovered" class="mt-1 block w-full border border-outline-variant rounded-lg p-2" /></label>
          <label class="block font-medium">People affected
            <input type="number" min="0" [(ngModel)]="affectedCount" id="incident-affected" class="mt-1 block w-full border border-outline-variant rounded-lg p-2" /></label>
          <label class="block font-medium sm:col-span-2">Data involved
            <input [(ngModel)]="dataKinds" id="incident-data" maxlength="500" placeholder="Names, phone numbers, diagnoses…" class="mt-1 block w-full border border-outline-variant rounded-lg p-2" /></label>
          <div><button type="button" id="incident-save" (click)="add()" [disabled]="!title.trim()"
            class="px-4 min-h-touch rounded-lg bg-primary text-white font-semibold disabled:opacity-50">Save</button></div>
        </div>
      }

      <div class="space-y-2" id="incident-list">
        @for (i of rows(); track i.id) {
          <div class="rounded-xl border border-outline-variant p-3 border-l-4" [attr.data-incident]="i.id"
            [style.border-left-color]="i.regulatorOverdue || i.individualsOverdue ? '#dc2626' : i.status === 'CLOSED' ? '#059669' : '#f59e0b'">
            <div class="flex flex-wrap justify-between gap-2">
              <p class="text-sm font-semibold">{{ i.title }} · {{ i.severity.toLowerCase() }} · {{ i.status.toLowerCase() }}</p>
              <p class="text-xs text-slate-600">Found {{ i.discoveredAt | date: 'd MMM y, HH:mm' }} · {{ i.affectedCount }} affected</p>
            </div>
            <p class="text-xs mt-1" [attr.data-regulator]="i.id" [class]="i.regulatorOverdue ? 'text-rose-700 font-semibold' : 'text-slate-700'">
              Regulator: {{ i.regulatorNotifiedAt ? 'told ' + (i.regulatorNotifiedAt | date: 'd MMM y, HH:mm') + (i.regulatorReference ? ' (' + i.regulatorReference + ')' : '')
                : (i.notNotifiableReason ? 'not needed' : (i.regulatorOverdue ? 'OVERDUE since ' : 'due by ') + (i.regulatorDueAt | date: 'd MMM y, HH:mm')) }}</p>
            <p class="text-xs" [class]="i.individualsOverdue ? 'text-rose-700 font-semibold' : 'text-slate-700'">
              People affected: {{ i.individualsNotifiedAt ? 'told ' + (i.individualsNotifiedAt | date: 'd MMM y')
                : (i.notNotifiableReason ? 'not needed: ' + i.notNotifiableReason : 'due by ' + (i.individualsDueAt | date: 'd MMM y')) }}</p>
            @if (i.status !== 'CLOSED') {
              <div class="mt-2 flex flex-wrap gap-2 text-sm">
                @if (!i.containedAt) {
                  <button type="button" [attr.data-contained]="i.id" (click)="update(i, { containedAt: now() })" class="px-3 min-h-touch rounded-lg border border-outline-variant">Contained now</button>
                }
                @if (!i.regulatorNotifiedAt && !i.notNotifiableReason) {
                  <input [(ngModel)]="reference[i.id]" [attr.data-reference]="i.id" maxlength="100" placeholder="Regulator's reference" class="border border-outline-variant rounded-lg p-2 w-40" />
                  <button type="button" [attr.data-told-regulator]="i.id" (click)="update(i, { regulatorNotifiedAt: now(), regulatorReference: reference[i.id] || null })"
                    class="px-3 min-h-touch rounded-lg border border-outline-variant">Regulator told now</button>
                }
                @if (!i.individualsNotifiedAt && !i.notNotifiableReason) {
                  <button type="button" [attr.data-told-people]="i.id" (click)="update(i, { individualsNotifiedAt: now() })" class="px-3 min-h-touch rounded-lg border border-outline-variant">People told now</button>
                }
                <button type="button" [attr.data-close]="i.id" (click)="update(i, { close: true })" class="px-3 min-h-touch rounded-lg bg-emerald-700 text-white">Close</button>
              </div>
            }
          </div>
        } @empty {
          <p class="text-sm text-slate-600">No breaches recorded.</p>
        }
      </div>
    </section>
  `,
})
export class IncidentsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly api = `${environment.apiUrl}/hms/privacy/incidents`;

  readonly categories = CATEGORIES;
  readonly rows = signal<Incident[]>([]);
  adding = false;
  title = '';
  category: IncidentCategory = 'UNAUTHORISED_ACCESS';
  severity: Incident['severity'] = 'MEDIUM';
  discoveredAt = nowLocal();
  affectedCount = 1;
  dataKinds = '';
  reference: Record<string, string> = {};
  /** An exact instant (with its zone), so the server agrees on when the 72 hours are up wherever it runs. */
  readonly now = () => new Date().toISOString();

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.http.get<ApiResponse<Incident[]>>(this.api).pipe(map((r) => r.data)).subscribe({ next: (r) => this.rows.set(r) });
  }

  add(): void {
    const body = { title: this.title.trim(), category: this.category, severity: this.severity, discoveredAt: new Date(this.discoveredAt).toISOString(),
      affectedCount: Number(this.affectedCount), dataKinds: this.dataKinds.trim() || null };
    this.http.post<ApiResponse<Incident>>(this.api, body).subscribe({
      next: () => {
        this.toast.success('Breach recorded');
        this.adding = false;
        this.title = this.dataKinds = '';
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  update(i: Incident, change: Record<string, unknown>): void {
    this.http.put<ApiResponse<Incident>>(`${this.api}/${i.id}`, change).subscribe({
      next: () => {
        this.toast.success('Breach updated');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }
}
