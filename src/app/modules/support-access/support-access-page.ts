import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SUPPORT_DURATIONS, SupportAccessService, SupportLogView, SupportRequestView } from '../../core/services/support-access.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * Support access, for the clinic owner. CodeAtCloud support can only enter this clinic after the owner approves
 * here, for the whole clinic and for a limited time (4 hours unless a shorter time is chosen). The owner can take
 * the approval back at any moment, and sees everything support did.
 */
@Component({
  selector: 'app-support-access-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl">
      <h1 class="text-2xl font-semibold text-on-surface">Support access</h1>
      <p class="text-sm text-slate-600 mt-1 mb-4">
        When you call CodeAtCloud support, they ask for access here. Nothing opens until you approve. Approval covers this
        whole clinic for the time you choose, and you can end it at any moment.
      </p>

      <div class="space-y-3" id="support-requests">
        @for (r of requests; track r.id) {
          <div class="bg-white rounded-xl border-2 p-4" [class.border-amber-400]="r.status === 'REQUESTED'"
               [class.border-emerald-500]="r.status === 'APPROVED'" [attr.data-request]="r.id">
            <p class="font-semibold">{{ r.staffName || 'CodeAtCloud support' }}
              <span class="text-sm font-normal text-slate-600">({{ roleLabel(r.staffRole) }})</span></p>
            @if (r.reason) { <p class="text-sm text-slate-700">{{ r.reason }}</p> }
            @if (r.status === 'REQUESTED') {
              <p class="text-sm text-slate-700 mt-1">Asked {{ r.requestedAt | date: 'd MMM, h:mm a' }}. Approve only if you are on the phone with them.</p>
              <div class="flex flex-wrap items-center gap-2 mt-3">
                <select class="duration border border-outline-variant rounded-lg min-h-touch px-2" [(ngModel)]="minutes" name="minutes" aria-label="How long">
                  @for (d of durations; track d.minutes) { <option [ngValue]="d.minutes">{{ d.label }}</option> }
                </select>
                <button type="button" class="approve bg-emerald-600 text-white px-4 min-h-touch rounded-lg text-sm font-medium" [disabled]="busy" (click)="approve(r)">Approve support access</button>
                <button type="button" class="deny bg-white border border-outline-variant px-4 min-h-touch rounded-lg text-sm" [disabled]="busy" (click)="deny(r)">Deny</button>
              </div>
            } @else {
              <p class="text-sm text-emerald-800 mt-1">
                Approved by {{ r.approvedBy }} until {{ r.expiresAt | date: 'h:mm a' }}.
                @if (r.sessionOpen) { <b> Support is signed in now.</b> }
              </p>
              <button type="button" class="revoke mt-3 bg-rose-600 text-white px-4 min-h-touch rounded-lg text-sm font-medium" [disabled]="busy" (click)="revoke(r)">End access now</button>
            }
          </div>
        }
        @if (loaded && requests.length === 0) { <p class="text-sm text-slate-600" id="no-support-requests">No support request is waiting and no access is open.</p> }
      </div>

      <h2 class="text-lg font-semibold mt-6 mb-2">What support did</h2>
      <button type="button" class="show-log text-sm font-semibold text-primary min-h-touch" (click)="loadLog()">{{ log ? 'Refresh' : 'Show the log' }}</button>
      @if (log) {
        <ul class="text-sm space-y-1 mt-2" id="support-log">
          @for (e of log.platform; track e.id) {
            <li>{{ e.createdAt | date: 'd MMM, h:mm:ss a' }} · <b>{{ e.actor }}</b> · {{ e.action }}@if (e.detail) { · {{ e.detail }} }</li>
          }
          @for (e of log.clinic; track e.id) {
            <li>{{ e.createdAt | date: 'd MMM, h:mm:ss a' }} · <b>{{ e.staffName }}</b> · {{ e.event }}@if (e.method) { · {{ e.method }} {{ e.path }} ({{ e.status }}) }</li>
          }
        </ul>
      }
    </div>
  `,
})
export class SupportAccessPageComponent implements OnInit {
  private service = inject(SupportAccessService);
  private toast = inject(ToastService);

  requests: SupportRequestView[] = [];
  durations = SUPPORT_DURATIONS;
  minutes = SUPPORT_DURATIONS[0].minutes;
  loaded = false;
  busy = false;
  log: SupportLogView | null = null;

  ngOnInit(): void {
    this.load();
  }

  roleLabel(role: string): string {
    return role === 'SUPPORT_READONLY' ? 'can only look' : role === 'SUPPORT_ADMIN' ? 'admin, changes need a second approval' : 'support agent';
  }

  load(): void {
    this.service.open().subscribe({
      next: (list) => { this.requests = list; this.loaded = true; },
      error: () => { this.loaded = true; this.toast.error('Could not load support requests.'); },
    });
  }

  loadLog(): void {
    this.service.log().subscribe({ next: (l) => (this.log = l), error: () => this.toast.error('Could not load the log.') });
  }

  approve(r: SupportRequestView): void { this.run(this.service.approve(r.id, this.minutes), 'Support access approved.'); }
  deny(r: SupportRequestView): void { this.run(this.service.deny(r.id), 'Request denied.'); }
  revoke(r: SupportRequestView): void { this.run(this.service.revoke(r.id), 'Support access ended.'); }

  private run(call: ReturnType<SupportAccessService['approve']>, done: string): void {
    this.busy = true;
    call.subscribe({
      next: () => { this.busy = false; this.toast.success(done); this.load(); },
      error: (e) => { this.busy = false; this.toast.error(e?.error?.message ?? 'Could not do that.'); this.load(); },
    });
  }
}
