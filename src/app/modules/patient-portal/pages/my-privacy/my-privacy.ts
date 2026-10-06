import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataRequest, DataRequestType, PrivacyService, PublicPrivacy, REQUEST_TYPES } from '../../../../core/services/privacy.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { PatientConsentsComponent } from '../../../privacy/patient-consents';

/**
 * The patient's privacy page: their choices (which they can change), a copy of their data to download, requests to
 * the clinic (correct, delete, complain…) with the clinic's answers, who to contact, and the clinic's notice.
 */
@Component({
  selector: 'app-my-privacy',
  standalone: true,
  imports: [PatientConsentsComponent, DatePipe, FormsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl space-y-4">
      <h1 class="text-2xl font-semibold text-on-surface">Privacy</h1>
      <app-patient-consents [canEdit]="true" [canExport]="true"></app-patient-consents>

      <section class="bg-white rounded-xl border border-outline-variant p-4" id="my-requests">
        <h2 class="font-semibold mb-1">Ask the clinic about your data</h2>
        <p class="text-xs text-slate-600 mb-2">The clinic answers within 30 days.</p>
        <div class="grid grid-cols-1 gap-2 text-sm">
          <select [(ngModel)]="type" id="my-request-type" aria-label="What you ask" class="border border-outline-variant rounded-lg p-2 bg-white">
            @for (t of types; track t.code) { <option [value]="t.code">{{ t.label }}</option> }
          </select>
          <textarea [(ngModel)]="details" id="my-request-details" rows="3" maxlength="4000" aria-label="Details"
            placeholder="What would you like? For a correction, say what is wrong." class="border border-outline-variant rounded-lg p-2"></textarea>
          <div><button type="button" id="my-request-send" (click)="send()" class="px-4 min-h-touch rounded-lg bg-primary text-white font-semibold">Send</button></div>
        </div>
        @if (requests().length) {
          <ul class="mt-3 space-y-2" id="my-request-list">
            @for (r of requests(); track r.id) {
              <li class="rounded-lg bg-slate-50 p-2 text-sm" [attr.data-request]="r.id">
                <p class="font-medium">{{ label(r.type) }} · {{ statusLabel(r) }}</p>
                <p class="text-xs text-slate-600">Sent {{ r.receivedAt | date: 'd MMM y' }}{{ r.closedAt ? '' : ', answer due by ' + (r.dueAt | date: 'd MMM y') }}</p>
                @if (r.response) { <p class="mt-1">{{ r.response }}</p> }
              </li>
            }
          </ul>
        }
      </section>

      @if (info(); as p) {
        <section class="bg-white rounded-xl border border-outline-variant p-4" id="my-privacy-officer">
          <h2 class="font-semibold mb-1">Questions about your data</h2>
          @if (p.officer.name || p.officer.email || p.officer.phone) {
            <p class="text-sm text-on-surface">{{ p.officer.name }}</p>
            @if (p.officer.email) { <p class="text-sm"><a class="text-indigo-700 underline" [href]="'mailto:' + p.officer.email">{{ p.officer.email }}</a></p> }
            @if (p.officer.phone) { <p class="text-sm"><a class="text-indigo-700 underline" [href]="'tel:' + p.officer.phone">{{ p.officer.phone }}</a></p> }
          } @else {
            <p class="text-sm text-slate-600">Ask at the front desk for the clinic's privacy officer.</p>
          }
        </section>
        <section class="bg-white rounded-xl border border-outline-variant p-4" id="my-privacy-notice">
          <h2 class="font-semibold mb-1">{{ p.clinicName }}'s privacy notice{{ p.notice.builtIn ? '' : ' (version ' + p.notice.version + ')' }}</h2>
          <div class="whitespace-pre-line text-sm text-slate-700">{{ p.notice.body }}</div>
        </section>
      }
    </div>
  `,
})
export class MyPrivacy implements OnInit {
  private privacy = inject(PrivacyService);
  private tenantContext = inject(TenantContextService);
  private toast = inject(ToastService);

  readonly types = REQUEST_TYPES;
  readonly info = signal<PublicPrivacy | null>(null);
  readonly requests = signal<DataRequest[]>([]);
  type: DataRequestType = 'ACCESS';
  details = '';

  ngOnInit(): void {
    const code = this.tenantContext.tenantCode();
    if (code) this.privacy.publicView(code).subscribe({ next: (p) => this.info.set(p) });
    this.loadRequests();
  }

  loadRequests(): void {
    this.privacy.requests(true).subscribe({ next: (r) => this.requests.set(r) });
  }

  label(type: DataRequestType): string {
    return REQUEST_TYPES.find((t) => t.code === type)?.label ?? type;
  }

  statusLabel(r: DataRequest): string {
    return { OPEN: 'received', IN_PROGRESS: 'being handled', DONE: 'done', REFUSED: 'refused' }[r.status];
  }

  send(): void {
    this.privacy.makeRequest(true, { type: this.type, details: this.details.trim() || null }).subscribe({
      next: () => {
        this.toast.success('Your request was sent');
        this.details = '';
        this.loadRequests();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not sent.'),
    });
  }
}
