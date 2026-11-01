import { ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsentFormService } from '../../../core/services/consent-form.service';
import { ConsentForm, ConsentFormType, ConsentMethod } from '../../../core/models/consent-form.model';

/** Write up, print, and record the signature or refusal of a patient's consent forms (procedure, anaesthesia, admission). */
@Component({
  selector: 'app-consent-forms-panel',
  imports: [FormsModule, DatePipe],
  template: `
    <section id="consent-forms-panel" class="bg-white rounded-xl border border-gray-200 p-6 mt-6">
      <h2 class="text-lg font-bold text-[#1E293B] mb-3">Consent forms</h2>

      @if (canEdit()) {
        <div class="flex flex-wrap items-end gap-3">
          <label class="text-sm text-slate-700">Kind
            <select id="consent-type" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm bg-white" [(ngModel)]="type">
              <option value="PROCEDURE">Procedure</option>
              <option value="ANAESTHESIA">Anaesthesia</option>
              <option value="ADMISSION">Admission and treatment</option>
            </select>
          </label>
          @if (type !== 'ADMISSION') {
            <label class="text-sm text-slate-700 flex-1 min-w-[10rem]">Procedure
              <input id="consent-procedure" type="text" maxlength="200" class="block mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="procedure" />
            </label>
            <label class="text-sm text-slate-700 flex-1 min-w-[12rem]">What was explained (benefits, risks, alternatives)
              <input id="consent-risks" type="text" maxlength="2000" class="block mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="risks" />
            </label>
          }
          <button id="create-consent" type="button" (click)="create()" [disabled]="busy"
                  class="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50">Write up form</button>
        </div>
      }
      @if (error) {
        <p class="mt-2 text-sm text-red-700" role="alert">{{ error }}</p>
      }

      @if (forms.length === 0) {
        <p class="mt-3 text-sm text-slate-700">No consent forms for this patient yet.</p>
      }
      <ul class="mt-4 space-y-4">
        @for (f of forms; track f.id) {
          <li class="consent-row border border-gray-200 rounded-lg p-4 text-sm">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span><b>{{ f.title }}</b>@if (f.procedure) { &middot; {{ f.procedure }} } &middot; {{ f.number }} &middot; {{ f.createdAt | date: 'dd MMM yyyy' }}</span>
              <span class="status font-semibold"
                    [class.text-green-700]="f.status === 'SIGNED'" [class.text-red-700]="f.status === 'REFUSED'" [class.text-amber-800]="f.status === 'DRAFT'">
                {{ f.status === 'DRAFT' ? 'Waiting for signature' : f.status === 'SIGNED' ? 'Signed' : 'Declined' }}
              </span>
            </div>
            @if (f.status === 'SIGNED') {
              <p class="mt-1 text-slate-700">Signed by {{ f.signerName }} ({{ f.signerRelation }}){{ f.witnessName ? ', witness ' + f.witnessName : '' }}.</p>
            }
            <div class="mt-2 flex flex-wrap items-center gap-3">
              <button type="button" class="text-[#0052CC] hover:underline" (click)="open(f)">Print / open PDF</button>
              @if (canEdit() && f.status === 'DRAFT') {
                <button type="button" class="open-sign text-[#0052CC] hover:underline" (click)="signing = signing === f.id ? '' : f.id">Record signature</button>
                <button type="button" class="decline text-red-700 hover:underline" (click)="refuse(f)">Record refusal</button>
              }
            </div>
            @if (signing === f.id) {
              <div class="mt-3 flex flex-wrap items-end gap-3">
                <label class="text-sm text-slate-700">Name of the person who signed
                  <input id="sign-name" type="text" maxlength="120" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="signerName" />
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input id="sign-self" type="checkbox" [(ngModel)]="signerIsPatient" /> The patient signed
                </label>
                @if (!signerIsPatient) {
                  <label class="text-sm text-slate-700">Relation to the patient
                    <input id="sign-relation" type="text" maxlength="40" placeholder="Mother, Guardian, Spouse" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="signerRelation" />
                  </label>
                }
                <label class="text-sm text-slate-700">Witness (optional)
                  <input id="sign-witness" type="text" maxlength="120" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="witnessName" />
                </label>
                <label class="text-sm text-slate-700">Signed
                  <select id="sign-method" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm bg-white" [(ngModel)]="method">
                    <option value="PAPER">on paper</option>
                    <option value="IN_PERSON">in person</option>
                  </select>
                </label>
                <button id="confirm-sign" type="button" (click)="sign(f)" [disabled]="busy"
                        class="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">Save signature</button>
              </div>
            }
          </li>
        }
      </ul>
    </section>
  `,
})
export class ConsentFormsPanel implements OnInit {
  readonly patientId = input.required<string>();
  readonly canEdit = input<boolean>(false);

  private service = inject(ConsentFormService);
  private cdr = inject(ChangeDetectorRef);

  forms: ConsentForm[] = [];
  type: ConsentFormType = 'PROCEDURE';
  procedure = '';
  risks = '';
  signing = '';
  signerName = '';
  signerIsPatient = true;
  signerRelation = '';
  witnessName = '';
  method: ConsentMethod = 'PAPER';
  busy = false;
  error = '';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.service.list(this.patientId()).subscribe({
      next: (res) => {
        this.forms = res.success && res.data ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => undefined,
    });
  }

  create(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    const admission = this.type === 'ADMISSION';
    this.service
      .create(this.patientId(), {
        type: this.type,
        procedure: admission ? undefined : this.procedure.trim() || undefined,
        risksExplained: admission ? undefined : this.risks.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.busy = false;
          if (res.success) {
            this.procedure = '';
            this.risks = '';
            this.refresh();
          } else {
            this.error = res.message || 'The form could not be written up.';
          }
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err, 'The form could not be written up.'),
      });
  }

  sign(form: ConsentForm): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.service
      .sign(form.id, {
        signerName: this.signerName.trim(),
        signerIsPatient: this.signerIsPatient,
        signerRelation: this.signerIsPatient ? undefined : this.signerRelation.trim() || undefined,
        witnessName: this.witnessName.trim() || undefined,
        method: this.method,
      })
      .subscribe({
        next: () => {
          this.busy = false;
          this.signing = '';
          this.signerName = '';
          this.signerRelation = '';
          this.witnessName = '';
          this.signerIsPatient = true;
          this.refresh();
          this.cdr.markForCheck();
        },
        error: (err) => this.fail(err, 'The signature could not be recorded.'),
      });
  }

  refuse(form: ConsentForm): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.service.refuse(form.id).subscribe({
      next: () => {
        this.busy = false;
        this.refresh();
        this.cdr.markForCheck();
      },
      error: (err) => this.fail(err, 'The refusal could not be recorded.'),
    });
  }

  open(form: ConsentForm): void {
    this.service.pdf(form.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        this.error = 'The PDF could not be opened.';
        this.cdr.markForCheck();
      },
    });
  }

  private fail(err: { error?: { message?: string } }, fallback: string): void {
    this.busy = false;
    this.error = err?.error?.message || fallback;
    this.cdr.markForCheck();
  }
}
