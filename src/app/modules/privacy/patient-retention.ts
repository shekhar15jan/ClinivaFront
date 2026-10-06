import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientRetention, PrivacyService } from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * For the privacy officer on a patient's record: until when it is kept, legal hold (kept past that date for a claim
 * or court case), and anonymising now when allowed: past retention, or a registration with no medical records
 * (an erasure request).
 */
@Component({
  selector: 'app-patient-retention',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    @if (r(); as r) {
      <section class="bg-white rounded-xl border border-outline-variant p-4" id="patient-retention">
        <h2 class="font-semibold text-on-surface mb-1">Keeping the record</h2>
        @if (r.anonymisedAt) {
          <p class="text-sm text-slate-700" id="retention-anonymised">Anonymised on {{ r.anonymisedAt | date: 'd MMM y' }}: who the patient was is no longer held.</p>
        } @else {
          <p class="text-sm text-slate-700" id="retention-keep-until">
            {{ r.hasRecords ? 'Kept until ' + (r.keepUntil | date: 'd MMM y') + ' (last seen ' + (r.lastActivity | date: 'd MMM y') + ').' : 'No medical or billing records yet.' }}
            {{ r.legalHold ? ' On legal hold: ' + r.legalHoldReason + '.' : '' }}</p>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm">
            @if (r.legalHold) {
              <button type="button" id="retention-release" (click)="hold(false)" class="px-3 min-h-touch rounded-lg border border-outline-variant">Lift legal hold</button>
            } @else {
              <input [(ngModel)]="holdReason" id="retention-hold-reason" maxlength="255" placeholder="Reason, e.g. insurance claim 117"
                class="border border-outline-variant rounded-lg p-2 min-w-0 flex-1" />
              <button type="button" id="retention-hold" (click)="hold(true)" [disabled]="!holdReason.trim()"
                class="px-3 min-h-touch rounded-lg border border-outline-variant disabled:opacity-50">Keep on legal hold</button>
            }
          </div>
          @if (r.eligible) {
            <div class="mt-3 rounded-lg bg-rose-50 p-3 text-sm" id="retention-erase">
              @if (!confirming) {
                <button type="button" id="retention-anonymise" (click)="confirming = true" class="px-3 min-h-touch rounded-lg border border-rose-700 text-rose-800">Anonymise this patient</button>
              } @else {
                <p class="text-xs text-rose-900 mb-2">Name, contact, address, ABHA and portal login are removed for good. The medical and billing record stays without a name.</p>
                <input [(ngModel)]="reason" id="retention-anonymise-reason" maxlength="255" placeholder="Why, e.g. erasure request of 6 Oct"
                  class="border border-outline-variant rounded-lg p-2 w-full mb-2" />
                <button type="button" id="retention-anonymise-confirm" (click)="anonymise()" class="px-3 min-h-touch rounded-lg bg-rose-700 text-white">Yes, anonymise</button>
                <button type="button" (click)="confirming = false" class="px-3 min-h-touch rounded-lg border border-outline-variant ml-1">Cancel</button>
              }
            </div>
          }
        }
      </section>
    }
  `,
})
export class PatientRetentionComponent implements OnChanges {
  private privacy = inject(PrivacyService);
  private toast = inject(ToastService);

  @Input({ required: true }) patientId!: string;
  /** Told when the patient was anonymised, so the record on screen can be reloaded. */
  @Output() anonymised = new EventEmitter<void>();

  readonly r = signal<PatientRetention | null>(null);
  holdReason = '';
  reason = '';
  confirming = false;

  ngOnChanges(): void {
    this.privacy.patientRetention(this.patientId).subscribe({ next: (r) => this.r.set(r), error: () => this.r.set(null) });
  }

  hold(on: boolean): void {
    this.privacy.setHold(this.patientId, on, on ? this.holdReason.trim() : null).subscribe({
      next: (r) => {
        this.r.set(r);
        this.holdReason = '';
        this.toast.success(on ? 'Record kept on legal hold' : 'Legal hold lifted');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  anonymise(): void {
    this.privacy.anonymise(this.patientId, this.reason.trim() || null).subscribe({
      next: (r) => {
        this.r.set(r);
        this.confirming = false;
        this.toast.success('Patient anonymised');
        this.anonymised.emit();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not done.'),
    });
  }
}
