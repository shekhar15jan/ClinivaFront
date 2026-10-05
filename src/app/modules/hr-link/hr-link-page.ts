import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../../core/models/common.model';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/toast/toast.service';

interface Settings {
  endpointUrl: string | null;
  secretSet: boolean;
  enabled: boolean;
  sendStaff: boolean;
  sendPayouts: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
}

interface Delivery {
  id: string;
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
 * The link to the hospital's HR and payroll system: where it listens and the shared secret, what is sent (the staff
 * list, doctor payouts), a test, and the messages with their state. Attendance and salaries stay in HR.
 */
@Component({
  selector: 'app-hr-link-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">HR & payroll link</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Cliniva sends the staff list and approved doctor payouts to your HR and payroll system. Attendance and salaries are kept there.</p>
      @if (s) {
        <div class="rounded-xl p-3 mb-3 text-sm" id="hr-state"
          [class]="s.enabled ? (s.lastError ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900') : 'bg-slate-100 text-slate-700'">
          {{ s.enabled ? 'On.' : 'Off.' }}
          {{ s.lastSuccessAt ? ' Last accepted ' + (s.lastSuccessAt | date: 'd MMM, h:mm a') + '.' : '' }}
          {{ s.lastError ? ' Last problem: ' + s.lastError : '' }}
        </div>
        <div class="bg-white rounded-xl border border-outline-variant p-4 space-y-3 mb-3" id="hr-form">
          <label class="block text-sm font-medium">Address of the HR system
            <input [(ngModel)]="url" id="hr-url" maxlength="500" placeholder="https://hr.example.com/cliniva" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <label class="block text-sm font-medium">Shared secret {{ s.secretSet ? '(saved; type a new one to change it)' : '' }}
            <input [(ngModel)]="secret" id="hr-secret" type="password" autocomplete="new-password" maxlength="200" placeholder="At least 16 characters"
              class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <div class="flex gap-2 flex-wrap">
            <button type="button" (click)="enabled = !enabled" id="hr-enabled" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="enabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-outline-variant'">{{ enabled ? 'Link on' : 'Link off' }}</button>
            <button type="button" (click)="sendStaff = !sendStaff" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="sendStaff ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-outline-variant'">Staff list</button>
            <button type="button" (click)="sendPayouts = !sendPayouts" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="sendPayouts ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-outline-variant'">Doctor payouts</button>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button type="button" id="hr-save" (click)="save()" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
            <button type="button" id="hr-test" (click)="test()" [disabled]="!s.secretSet || !s.endpointUrl" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm disabled:opacity-50">Send a test</button>
            <button type="button" id="hr-send-staff" (click)="sendStaffList()" [disabled]="!s.enabled" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm disabled:opacity-50">Send the staff list now</button>
          </div>
          <details class="text-xs text-slate-600">
            <summary class="cursor-pointer">For the HR system's developers</summary>
            <p class="mt-1">Each message is a JSON POST with headers X-Cliniva-Event (staff.snapshot, payout.approved, payout.paid, link.test),
              X-Cliniva-Delivery (an id; ignore repeats), X-Cliniva-Timestamp (seconds) and X-Cliniva-Signature: sha256= the hex HMAC-SHA256 of
              timestamp + "." + body with the shared secret. Answer 2xx to accept; anything else is retried after 1, 5, 30, 120 and 360 minutes.</p>
          </details>
        </div>

        <h2 class="font-semibold mb-2">Messages</h2>
        <div class="space-y-2" id="hr-deliveries">
          @for (d of deliveries; track d.id) {
            <div class="bg-white rounded-xl border border-outline-variant p-3 flex justify-between gap-2 flex-wrap items-center border-l-4"
              [style.border-left-color]="d.status === 'SENT' ? '#059669' : d.status === 'FAILED' ? '#dc2626' : '#f59e0b'" [attr.data-delivery]="d.eventType">
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
export class HrLinkPageComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private readonly api = `${environment.apiUrl}/hms/hr-link`;

  s: Settings | null = null;
  url = '';
  secret = '';
  enabled = false;
  sendStaff = true;
  sendPayouts = true;
  deliveries: Delivery[] = [];

  ngOnInit(): void {
    this.http.get<ApiResponse<Settings>>(this.api).pipe(map((r) => r.data)).subscribe({ next: (s) => this.show(s) });
    this.loadDeliveries();
  }

  show(s: Settings): void {
    this.s = s;
    this.url = s.endpointUrl ?? '';
    this.enabled = s.enabled;
    this.sendStaff = s.sendStaff;
    this.sendPayouts = s.sendPayouts;
    this.secret = '';
  }

  loadDeliveries(): void {
    this.http.get<ApiResponse<RawPagedResponse<Delivery>>>(`${this.api}/deliveries`).pipe(map((r) => PagedResponse.from(r.data)))
      .subscribe({ next: (p) => (this.deliveries = p.content) });
  }

  save(): void {
    const body = { endpointUrl: this.url.trim() || null, secret: this.secret || null, enabled: this.enabled, sendStaff: this.sendStaff,
      sendPayouts: this.sendPayouts };
    this.http.put<ApiResponse<Settings>>(this.api, body).pipe(map((r) => r.data)).subscribe({
      next: (s) => {
        this.show(s);
        this.toast.success('HR link saved');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  test(): void {
    this.http.post<ApiResponse<{ ok: boolean; message: string }>>(`${this.api}/test`, {}).pipe(map((r) => r.data)).subscribe({
      next: (t) => (t.ok ? this.toast.success(t.message) : this.toast.error(t.message)),
      error: (err) => this.toast.error(err?.error?.message || 'The test could not be sent.'),
    });
  }

  sendStaffList(): void {
    this.http.post(`${this.api}/send-staff`, {}).subscribe({
      next: () => {
        this.toast.success('The staff list will be sent in a moment');
        this.loadDeliveries();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not queued.'),
    });
  }

  retry(d: Delivery): void {
    this.http.post(`${this.api}/deliveries/${d.id}/retry`, {}).subscribe({ next: () => this.loadDeliveries() });
  }
}
