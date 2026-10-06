import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DataRequest, DataRequestSource, DataRequestStatus, DataRequestType, PrivacyService, REQUEST_TYPES,
} from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * The privacy officer's register of requests about personal data: each due 30 days after it arrived (overdue ones
 * stand out), worked through to done or refused with the answer given, which the patient then sees in the portal.
 */
@Component({
  selector: 'app-data-requests',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="bg-white rounded-xl border border-outline-variant p-4 mb-4" id="data-requests">
      <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
        <h2 class="font-semibold">Requests about data</h2>
        <div class="flex gap-2">
          <button type="button" id="requests-open-only" (click)="openOnly = !openOnly; load()"
            class="px-3 min-h-touch rounded-full text-sm border" [class]="openOnly ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-outline-variant'">
            {{ openOnly ? 'Open only' : 'All' }}</button>
          <button type="button" id="request-new" (click)="adding = !adding" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">
            {{ adding ? 'Cancel' : 'Record a request' }}</button>
        </div>
      </div>
      <p class="text-xs text-slate-600 mb-3">Answer within 30 days: the shortest deadline of the laws Cliniva serves (GDPR one month, PDPA and PDPL 30 days, DPDP grievances 90 days).</p>

      @if (adding) {
        <div class="rounded-lg bg-slate-50 p-3 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" id="request-form">
          <label class="block font-medium">What is asked
            <select [(ngModel)]="newType" id="request-type" class="mt-1 block w-full border border-outline-variant rounded-lg p-2 bg-white">
              @for (t of types; track t.code) { <option [value]="t.code">{{ t.label }}</option> }
            </select></label>
          <label class="block font-medium">Received by
            <select [(ngModel)]="newSource" id="request-source" class="mt-1 block w-full border border-outline-variant rounded-lg p-2 bg-white">
              <option value="DESK">At the desk</option><option value="EMAIL">Email</option><option value="POST">Post</option>
            </select></label>
          <label class="block font-medium">From
            <input [(ngModel)]="newName" id="request-name" maxlength="150" class="mt-1 block w-full border border-outline-variant rounded-lg p-2" /></label>
          <label class="block font-medium">Email or phone
            <input [(ngModel)]="newContact" id="request-contact" maxlength="254" class="mt-1 block w-full border border-outline-variant rounded-lg p-2" /></label>
          <label class="block font-medium sm:col-span-2">Details
            <textarea [(ngModel)]="newDetails" id="request-details" rows="2" maxlength="4000" class="mt-1 block w-full border border-outline-variant rounded-lg p-2"></textarea></label>
          <div><button type="button" id="request-save" (click)="add()" [disabled]="!newName.trim()"
            class="px-4 min-h-touch rounded-lg bg-primary text-white font-semibold disabled:opacity-50">Save</button></div>
        </div>
      }

      <div class="space-y-2" id="request-list">
        @for (r of rows(); track r.id) {
          <div class="rounded-xl border border-outline-variant p-3 border-l-4" [attr.data-request]="r.id"
            [style.border-left-color]="r.overdue ? '#dc2626' : r.status === 'DONE' ? '#059669' : r.status === 'REFUSED' ? '#64748b' : '#f59e0b'">
            <div class="flex flex-wrap justify-between gap-2">
              <p class="text-sm font-semibold">{{ label(r.type) }} · {{ r.requesterName }}</p>
              <p class="text-xs" [class]="r.overdue ? 'text-rose-700 font-semibold' : 'text-slate-600'">
                {{ r.overdue ? 'Overdue since ' : (closed(r) ? 'Closed ' : 'Due ') }}{{ (closed(r) ? r.closedAt : r.dueAt) | date: 'd MMM y' }}</p>
            </div>
            <p class="text-xs text-slate-600">{{ r.source.toLowerCase() }}, {{ r.receivedAt | date: 'd MMM y' }}{{ r.requesterContact ? ' · ' + r.requesterContact : '' }}</p>
            @if (r.details) { <p class="text-sm mt-1">{{ r.details }}</p> }
            @if (closed(r)) {
              <p class="text-sm mt-1"><span class="font-medium">{{ r.status === 'DONE' ? 'Done' : 'Refused' }}:</span> {{ r.response }}</p>
            } @else {
              <div class="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                <select [(ngModel)]="status[r.id]" [attr.data-status]="r.id" class="border border-outline-variant rounded-lg p-2 bg-white">
                  <option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option>
                  <option value="DONE">Done</option><option value="REFUSED">Refused</option>
                </select>
                <input [(ngModel)]="answer[r.id]" [attr.data-answer]="r.id" maxlength="4000" placeholder="The answer given (needed to close)"
                  class="sm:col-span-2 border border-outline-variant rounded-lg p-2" />
                <button type="button" [attr.data-update]="r.id" (click)="update(r)" class="px-3 min-h-touch rounded-lg border border-outline-variant">Update</button>
              </div>
            }
          </div>
        } @empty {
          <p class="text-sm text-slate-600">No requests{{ openOnly ? ' waiting' : '' }}.</p>
        }
      </div>
    </section>
  `,
})
export class DataRequestsComponent implements OnInit {
  private privacy = inject(PrivacyService);
  private toast = inject(ToastService);

  readonly types = REQUEST_TYPES;
  readonly rows = signal<DataRequest[]>([]);
  openOnly = true;
  adding = false;
  newType: DataRequestType = 'ACCESS';
  newSource: DataRequestSource = 'DESK';
  newName = '';
  newContact = '';
  newDetails = '';
  status: Record<string, DataRequestStatus> = {};
  answer: Record<string, string> = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.privacy.requests(false, this.openOnly).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        for (const r of rows) {
          this.status[r.id] = r.status;
          this.answer[r.id] = r.response ?? '';
        }
      },
    });
  }

  label(type: DataRequestType): string {
    return REQUEST_TYPES.find((t) => t.code === type)?.label ?? type;
  }

  closed(r: DataRequest): boolean {
    return r.status === 'DONE' || r.status === 'REFUSED';
  }

  add(): void {
    this.privacy.makeRequest(false, { type: this.newType, source: this.newSource, requesterName: this.newName.trim(),
      requesterContact: this.newContact.trim() || null, details: this.newDetails.trim() || null }).subscribe({
      next: () => {
        this.toast.success('Request recorded');
        this.adding = false;
        this.newName = this.newContact = this.newDetails = '';
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  update(r: DataRequest): void {
    this.privacy.updateRequest(r.id, { status: this.status[r.id], response: this.answer[r.id]?.trim() || null }).subscribe({
      next: () => {
        this.toast.success('Request updated');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }
}
