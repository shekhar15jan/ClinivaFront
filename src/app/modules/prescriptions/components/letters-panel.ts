import { ChangeDetectorRef, Component, OnInit, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LetterService } from '../../../core/services/letter.service';
import { IssueLetterRequest, LETTER_TITLES, Letter, LetterType } from '../../../core/models/letter.model';

/** Issue and print a medical certificate, fitness certificate or referral letter for a consultation (the doctor's page). */
@Component({
  selector: 'app-letters-panel',
  imports: [FormsModule, DatePipe],
  template: `
    <section id="letters-panel" class="border-t border-gray-200 p-6">
      <h2 class="text-lg font-bold text-[#1E293B] mb-3">Certificates and letters</h2>

      <div class="flex flex-wrap items-end gap-3">
        <label class="text-sm text-slate-700">
          Kind
          <select id="letter-type" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm bg-white" [(ngModel)]="type">
            <option value="MEDICAL_CERTIFICATE">Medical certificate (rest)</option>
            <option value="FITNESS_CERTIFICATE">Fitness certificate</option>
            <option value="REFERRAL">Referral letter</option>
          </select>
        </label>

        @if (type === 'MEDICAL_CERTIFICATE') {
          <label class="text-sm text-slate-700">First day of rest
            <input id="letter-from" type="date" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="fromDate" />
          </label>
          <label class="text-sm text-slate-700">Last day of rest
            <input id="letter-to" type="date" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="toDate" />
          </label>
        }
        @if (type === 'FITNESS_CERTIFICATE') {
          <label class="text-sm text-slate-700">Fit from
            <input id="letter-from" type="date" class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="fromDate" />
          </label>
          <label class="text-sm text-slate-700">Fit for
            <input id="letter-purpose" type="text" maxlength="300" placeholder="work, school, travel, sport"
                   class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="purpose" />
          </label>
        }
        @if (type === 'REFERRAL') {
          <label class="text-sm text-slate-700">Refer to
            <input id="letter-referred" type="text" maxlength="150" placeholder="Doctor, department or hospital"
                   class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="referredTo" />
          </label>
          <label class="text-sm text-slate-700">For
            <input id="letter-purpose" type="text" maxlength="300" placeholder="e.g. an echocardiogram"
                   class="block mt-1 border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="purpose" />
          </label>
        }
        <label class="text-sm text-slate-700 flex-1 min-w-[10rem]">Remarks (optional)
          <input id="letter-remarks" type="text" maxlength="1000" class="block mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm" [(ngModel)]="remarks" />
        </label>
        <button id="issue-letter" type="button" (click)="issue()" [disabled]="busy"
                class="px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50">
          {{ busy ? 'Working...' : 'Issue and open' }}
        </button>
      </div>
      @if (error) {
        <p class="mt-2 text-sm text-red-700" role="alert">{{ error }}</p>
      }

      @if (letters.length) {
        <ul class="mt-4 divide-y divide-gray-100 text-sm">
          @for (l of letters; track l.id) {
            <li class="letter-row flex items-center justify-between py-2">
              <span><b>{{ title(l.type) }}</b> &middot; {{ l.number }} &middot; {{ l.issuedAt | date: 'dd MMM yyyy' }}</span>
              <button type="button" class="text-[#0052CC] hover:underline" (click)="open(l)">Open PDF</button>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class LettersPanel implements OnInit {
  readonly consultationId = input.required<string>();

  private letterService = inject(LetterService);
  private cdr = inject(ChangeDetectorRef);

  type: LetterType = 'MEDICAL_CERTIFICATE';
  fromDate = '';
  toDate = '';
  referredTo = '';
  purpose = '';
  remarks = '';
  letters: Letter[] = [];
  busy = false;
  error = '';

  ngOnInit(): void {
    this.refresh();
  }

  title(type: LetterType): string {
    return LETTER_TITLES[type];
  }

  refresh(): void {
    this.letterService.list(this.consultationId()).subscribe({
      next: (res) => {
        this.letters = res.success && res.data ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => undefined,
    });
  }

  /** What is sent: only the boxes that belong to the chosen kind. */
  request(): IssueLetterRequest {
    const clean = (v: string) => v.trim() || undefined;
    switch (this.type) {
      case 'MEDICAL_CERTIFICATE':
        return { type: this.type, fromDate: this.fromDate || undefined, toDate: this.toDate || undefined, remarks: clean(this.remarks) };
      case 'FITNESS_CERTIFICATE':
        return { type: this.type, fromDate: this.fromDate || undefined, purpose: clean(this.purpose), remarks: clean(this.remarks) };
      default:
        return { type: this.type, referredTo: clean(this.referredTo), purpose: clean(this.purpose), remarks: clean(this.remarks) };
    }
  }

  issue(): void {
    if (this.busy) return;
    this.busy = true;
    this.error = '';
    this.letterService.issue(this.consultationId(), this.request()).subscribe({
      next: (res) => {
        this.busy = false;
        if (res.success && res.data) {
          this.refresh();
          this.open(res.data);
        } else {
          this.error = res.message || 'The letter could not be issued.';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.message || 'The letter could not be issued.';
        this.cdr.markForCheck();
      },
    });
  }

  open(letter: Letter): void {
    this.letterService.pdf(letter.id).subscribe({
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
}
