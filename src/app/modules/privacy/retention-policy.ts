import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PrivacyService, RetentionPolicy } from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * How long the clinic keeps records after a patient's last visit, whether they are anonymised automatically each
 * night, and the patients due now. Anonymising removes who the patient is; the clinical and billing record stays.
 */
@Component({
  selector: 'app-retention-policy',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <section class="bg-white rounded-xl border border-outline-variant p-4 mb-4" id="retention">
      <h2 class="font-semibold">How long records are kept</h2>
      <p class="text-xs text-slate-600 mb-3">Counted from the patient's last visit, test, stay or bill. Check your local law:
        for example 3 years for outpatients in India, 8 in the UK, 6 to 10 in most US states, 10 in Germany.</p>
      @if (p(); as p) {
        <div class="flex flex-wrap items-end gap-3 mb-3">
          <label class="block text-sm font-medium">Years
            <input type="number" [(ngModel)]="years" id="retention-years" min="3" max="30"
              class="block w-24 mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <button type="button" id="retention-auto" (click)="auto = !auto" class="px-3 min-h-touch rounded-full text-sm border"
            [class]="auto ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-outline-variant'">
            {{ auto ? 'Anonymise automatically each night' : 'I review and anonymise' }}</button>
          <button type="button" id="retention-save" (click)="save()" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
        </div>
        <div class="rounded-lg p-3 text-sm" id="retention-due" [class]="p.dueShown ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'">
          @if (p.dueShown) {
            <p class="font-medium mb-1">{{ p.dueShown }}{{ p.dueShown === 200 ? '+' : '' }} {{ p.dueShown === 1 ? 'patient is' : 'patients are' }} past {{ p.retentionYears }} years.</p>
            <ul class="text-xs space-y-0.5 mb-2 max-h-40 overflow-y-auto">
              @for (d of p.due; track d.patientId) {
                <li [attr.data-due]="d.patientId"><a [routerLink]="['../patients', d.patientId]" class="underline">{{ d.patientCode }} {{ d.name }}</a>,
                  last seen {{ d.lastActivity | date: 'd MMM y' }}</li>
              }
            </ul>
            @if (!confirming) {
              <button type="button" id="retention-run" (click)="confirming = true" class="px-3 min-h-touch rounded-lg border border-amber-700 text-sm">Anonymise them now</button>
            } @else {
              <span class="text-xs mr-2">Names, contacts and logins are removed for good.</span>
              <button type="button" id="retention-run-confirm" (click)="run()" class="px-3 min-h-touch rounded-lg bg-rose-700 text-white text-sm">Yes, anonymise</button>
              <button type="button" (click)="confirming = false" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm ml-1">Cancel</button>
            }
          } @else {
            <p>No patient is past the retention period.</p>
          }
        </div>
      }
    </section>
  `,
})
export class RetentionPolicyComponent implements OnInit {
  private privacy = inject(PrivacyService);
  private toast = inject(ToastService);

  readonly p = signal<RetentionPolicy | null>(null);
  years = 10;
  auto = false;
  confirming = false;

  ngOnInit(): void {
    this.privacy.retention().subscribe({ next: (p) => this.show(p) });
  }

  private show(p: RetentionPolicy): void {
    this.p.set(p);
    this.years = p.retentionYears;
    this.auto = p.autoAnonymise;
    this.confirming = false;
  }

  save(): void {
    this.privacy.saveRetention(Number(this.years), this.auto).subscribe({
      next: (p) => {
        this.show(p);
        this.toast.success('Retention saved');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  run(): void {
    this.privacy.runRetention().subscribe({
      next: (r) => {
        this.toast.success(`${r.anonymised} ${r.anonymised === 1 ? 'patient' : 'patients'} anonymised`);
        this.privacy.retention().subscribe({ next: (p) => this.show(p) });
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not done.'),
    });
  }
}
