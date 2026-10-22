import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../../core/models/common.model';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/toast/toast.service';

interface Settings {
  companyId: string | null;
  stateCode: string | null;
  enabled: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
}

interface AccountingEvent {
  id: string;
  sourceEventId: string;
  eventType: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  attempts: number;
  lastStatus: number | null;
  lastError: string | null;
  createdAt: string;
  sentAt: string | null;
  nextAttemptAt: string;
}

/**
 * The link to Accounting: which Accounting company this clinic's bills, payments, advances, refunds and doctor payouts
 * go to, the state code used as the place of supply for GST, and the events with their state.
 */
@Component({
  selector: 'app-accounting-link-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">Accounting link</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Cliniva sends bills (with the GST split), payments, advances, refunds and doctor payouts to your company in CodeAtCloud Accounting, so the books and the GST returns follow the clinic.</p>
      @if (s) {
        <div class="rounded-xl p-3 mb-3 text-sm" id="al-state"
          [class]="s.enabled ? (s.lastError ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900') : 'bg-slate-100 text-slate-700'">
          {{ s.enabled ? 'On.' : 'Off.' }}
          {{ s.lastSuccessAt ? ' Last accepted ' + (s.lastSuccessAt | date: 'd MMM, h:mm a') + '.' : '' }}
          {{ s.lastError ? ' Last problem: ' + s.lastError : '' }}
        </div>
        <div class="bg-white rounded-xl border border-outline-variant p-4 space-y-3 mb-3" id="al-form">
          <label class="block text-sm font-medium">Accounting company id
            <input [(ngModel)]="companyId" id="al-company" maxlength="36" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <label class="block text-sm font-medium">State code of the clinic (GST place of supply)
            <input [(ngModel)]="stateCode" id="al-state-code" maxlength="2" inputmode="numeric" placeholder="27" class="block w-24 mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <div class="flex gap-2 flex-wrap">
            <button type="button" (click)="enabled = !enabled" id="al-enabled" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="enabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-outline-variant'">{{ enabled ? 'Link on' : 'Link off' }}</button>
            <button type="button" id="al-save" (click)="save()" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
          </div>
        </div>

        <h2 class="font-semibold mb-2">Events sent</h2>
        <div class="space-y-2" id="al-events">
          @for (d of events; track d.id) {
            <div class="bg-white rounded-xl border border-outline-variant p-3 flex justify-between gap-2 flex-wrap items-center border-l-4"
              [style.border-left-color]="d.status === 'SENT' ? '#059669' : d.status === 'FAILED' ? '#dc2626' : '#f59e0b'" [attr.data-event]="d.eventType">
              <div>
                <p class="text-sm font-semibold">{{ d.eventType }} · {{ d.status.toLowerCase() }}</p>
                <p class="text-xs text-slate-600">{{ d.createdAt | date: 'd MMM, h:mm a' }} · {{ d.attempts }} {{ d.attempts === 1 ? 'try' : 'tries' }}{{ d.lastError ? ' · ' + d.lastError : '' }}</p>
              </div>
              @if (d.status === 'FAILED') {
                <button type="button" (click)="retry(d)" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">Send again</button>
              }
            </div>
          } @empty {
            <p class="text-sm text-slate-600">Nothing sent yet.</p>
          }
        </div>
      }
    </div>
  `,
})
export class AccountingLinkPageComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly api = `${environment.apiUrl}/hms/accounting-link`;

  s: Settings | null = null;
  companyId = '';
  stateCode = '';
  enabled = false;
  events: AccountingEvent[] = [];

  ngOnInit(): void {
    this.http.get<ApiResponse<Settings>>(this.api).pipe(map((r) => r.data)).subscribe({ next: (s) => this.show(s) });
    this.loadEvents();
  }

  show(s: Settings): void {
    this.s = s;
    this.companyId = s.companyId ?? '';
    this.stateCode = s.stateCode ?? '';
    this.enabled = s.enabled;
  }

  loadEvents(): void {
    this.http.get<ApiResponse<RawPagedResponse<AccountingEvent>>>(`${this.api}/events`).pipe(map((r) => PagedResponse.from(r.data)))
      .subscribe({ next: (p) => (this.events = p.content) });
  }

  save(): void {
    const body = { companyId: this.companyId.trim() || null, stateCode: this.stateCode.trim() || null, enabled: this.enabled };
    this.http.put<ApiResponse<Settings>>(this.api, body).pipe(map((r) => r.data)).subscribe({
      next: (s) => {
        this.show(s);
        this.toast.success('Accounting link saved');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  retry(d: AccountingEvent): void {
    this.http.post(`${this.api}/events/${d.id}/retry`, {}).subscribe({ next: () => this.loadEvents() });
  }
}
