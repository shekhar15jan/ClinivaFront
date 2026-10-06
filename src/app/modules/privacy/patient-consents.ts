import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Consent, ConsentMethod, ConsentRequest, PatientConsents, PrivacyService } from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';

const METHOD_LABEL: Record<ConsentMethod, string> = { PORTAL: 'in the portal', IN_PERSON: 'in person', PAPER: 'on paper' };

/**
 * A patient's consents, one row per purpose: yes, no or not asked yet, how and when, and who gave it (the patient
 * or a named guardian). Staff record a change and say how it was given; a patient changes their own in the portal.
 * Every change is kept in the history.
 */
@Component({
  selector: 'app-patient-consents',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="bg-white rounded-xl border border-outline-variant p-4" id="patient-consents">
      <div class="flex flex-wrap justify-between items-center gap-2 mb-1">
        <h2 class="font-semibold text-on-surface">{{ self ? 'Your choices' : 'Privacy and consent' }}</h2>
        @if (canExport) {
          <button type="button" id="consents-export" (click)="download()" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">
            <span class="material-symbols-outlined text-[18px] align-middle">download</span> {{ self ? 'Download my data' : 'Download all data' }}</button>
        }
      </div>
      @if (data(); as d) {
        @if (d.minor) {
          <p class="text-xs text-indigo-900 bg-indigo-50 rounded-lg p-2 mb-2" id="consents-minor">
            Under {{ d.consentAge }}: a parent or guardian gives these consents.</p>
        }
        <div class="divide-y divide-outline-variant">
          @for (c of d.current; track c.purpose) {
            <div class="py-2 flex flex-wrap items-center justify-between gap-2" [attr.data-purpose]="c.purpose">
              <div class="min-w-0">
                <p class="text-sm text-on-surface">{{ c.label }}</p>
                <p class="text-xs text-slate-600">{{ describe(c) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [attr.data-state]="state(c)"
                  [class]="c.granted === true ? 'bg-emerald-100 text-emerald-800' : c.granted === false ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'">
                  {{ c.granted === true ? 'Yes' : c.granted === false ? 'No' : 'Not asked' }}</span>
                @if (canEdit) {
                  <button type="button" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm"
                    [attr.data-change]="c.purpose" (click)="change(c)">{{ c.granted === true ? 'Withdraw' : 'Agree' }}</button>
                }
              </div>
            </div>
          }
        </div>
        @if (canEdit && (d.minor || !self)) {
          <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            @if (!self) {
              <label class="block font-medium">Given
                <select [(ngModel)]="method" id="consent-method" class="mt-1 block w-full border border-outline-variant rounded-lg p-2 text-sm bg-white">
                  <option value="IN_PERSON">In person</option>
                  <option value="PAPER">On paper</option>
                </select></label>
            }
            @if (d.minor) {
              <label class="block font-medium">Parent or guardian
                <input [(ngModel)]="guardianName" id="consent-guardian-name" maxlength="150" class="mt-1 block w-full border border-outline-variant rounded-lg p-2 text-sm" /></label>
              <label class="block font-medium">Relation
                <input [(ngModel)]="guardianRelation" id="consent-guardian-relation" maxlength="50" placeholder="Mother, Father, Guardian"
                  class="mt-1 block w-full border border-outline-variant rounded-lg p-2 text-sm" /></label>
            }
          </div>
        }
        @if (d.history.length) {
          <details class="mt-3 text-xs text-slate-700" id="consent-history">
            <summary class="cursor-pointer">History ({{ d.history.length }})</summary>
            <ul class="mt-1 space-y-1">
              @for (h of d.history; track $index) {
                <li>{{ h.recordedAt | date: 'd MMM y, h:mm a' }} · {{ h.label }}: {{ h.granted ? 'yes' : 'no' }} · {{ describe(h) }}</li>
              }
            </ul>
          </details>
        }
      } @else {
        <p class="text-sm text-slate-600">Loading…</p>
      }
    </section>
  `,
})
export class PatientConsentsComponent implements OnChanges {
  private privacy = inject(PrivacyService);
  private toast = inject(ToastService);

  /** The patient; left out, the signed-in patient's own choices. */
  @Input() patientId: string | null = null;
  @Input() canEdit = false;
  /** A copy of everything held about the patient, as a file (the privacy officer, or the patient themselves). */
  @Input() canExport = false;

  readonly data = signal<PatientConsents | null>(null);
  method: ConsentMethod = 'IN_PERSON';
  guardianName = '';
  guardianRelation = '';

  get self(): boolean {
    return !this.patientId;
  }

  ngOnChanges(): void {
    this.privacy.consents(this.patientId).subscribe({
      next: (d) => this.data.set(d),
      error: () => this.data.set(null),
    });
  }

  download(): void {
    this.privacy.downloadExport(this.patientId).subscribe({
      next: () => this.toast.success('Download started'),
      error: () => this.toast.error('The data could not be downloaded.'),
    });
  }

  state(c: Consent): string {
    return c.granted === true ? 'yes' : c.granted === false ? 'no' : 'not-asked';
  }

  describe(c: Consent): string {
    if (!c.recordedAt || !c.method) return 'Not asked yet';
    const who = c.givenBy === 'GUARDIAN' ? `by ${c.guardianName} (${c.guardianRelation})` : this.self ? 'by you' : 'by the patient';
    return `${c.granted ? 'Given' : 'Refused or withdrawn'} ${who}, ${METHOD_LABEL[c.method]}, notice v${c.noticeVersion}`;
  }

  change(c: Consent): void {
    const d = this.data();
    if (!d) return;
    if (d.minor && (!this.guardianName.trim() || !this.guardianRelation.trim())) {
      this.toast.error("Enter the parent or guardian's name and relation first.");
      return;
    }
    const request: ConsentRequest = {
      purpose: c.purpose,
      granted: c.granted !== true,
      method: this.self ? undefined : this.method,
      givenBy: d.minor ? 'GUARDIAN' : 'SELF',
      guardianName: d.minor ? this.guardianName.trim() : null,
      guardianRelation: d.minor ? this.guardianRelation.trim() : null,
    };
    this.privacy.record(this.patientId, request).subscribe({
      next: (fresh) => {
        this.data.set(fresh);
        this.toast.success(request.granted ? 'Consent recorded' : 'Consent withdrawn');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }
}
