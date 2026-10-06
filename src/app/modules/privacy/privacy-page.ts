import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrivacyNotice, PrivacyService, PrivacySettings } from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * The clinic's privacy set-up: who patients contact about their data (the DPDP grievance officer, the GDPR data
 * protection officer), the age below which a guardian consents, and the privacy notice. A notice is published as a
 * new version and never edited, since each consent names the version its patient was shown.
 */
@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">Privacy</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">What patients are told about their data, who they contact, and when a guardian decides for them.</p>
      @if (s(); as s) {
        <div class="bg-white rounded-xl border border-outline-variant p-4 space-y-3 mb-4" id="privacy-officer">
          <h2 class="font-semibold">Privacy officer</h2>
          <p class="text-xs text-slate-600">Shown in the notice and the patient portal. India: the grievance officer; EU and UK: the data protection officer.</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label class="block text-sm font-medium">Name
              <input [(ngModel)]="officerName" id="privacy-officer-name" maxlength="150" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
            <label class="block text-sm font-medium">Email
              <input [(ngModel)]="officerEmail" id="privacy-officer-email" type="email" maxlength="254" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
            <label class="block text-sm font-medium">Phone
              <input [(ngModel)]="officerPhone" id="privacy-officer-phone" type="tel" maxlength="16" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          </div>
          <label class="block text-sm font-medium max-w-xs">A guardian consents for patients under
            <select [(ngModel)]="consentAge" id="privacy-consent-age" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm bg-white">
              <option [ngValue]="18">18 (India DPDP, Gulf)</option>
              <option [ngValue]="16">16 (GDPR default)</option>
              <option [ngValue]="15">15</option>
              <option [ngValue]="14">14</option>
              <option [ngValue]="13">13 (UK GDPR, lowest GDPR age)</option>
            </select></label>
          <button type="button" id="privacy-save" (click)="save()" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
        </div>

        <div class="bg-white rounded-xl border border-outline-variant p-4 space-y-3 mb-4" id="privacy-notice">
          <div class="flex flex-wrap justify-between items-baseline gap-2">
            <h2 class="font-semibold">Privacy notice</h2>
            <span class="text-xs px-2 py-0.5 rounded-full" id="privacy-notice-version"
              [class]="s.notice.builtIn ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'">
              {{ s.notice.builtIn ? 'Built-in notice (not yet your own)' : 'Version ' + s.notice.version + ', ' + (s.notice.publishedAt | date: 'd MMM y') }}</span>
          </div>
          <p class="text-xs text-slate-600">Start from the text below and make it yours; have it checked by your lawyer. Publishing makes a new version; patients see it from then on.</p>
          <textarea [(ngModel)]="draft" id="privacy-notice-body" rows="14" maxlength="20000"
            class="block w-full border border-outline-variant rounded-lg p-3 text-sm font-mono"></textarea>
          <button type="button" id="privacy-publish" (click)="publish()" [disabled]="!draft.trim() || draft.trim() === s.notice.body"
            class="px-4 min-h-touch rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">Publish as version {{ nextVersion }}</button>
        </div>

        @if (s.versions.length) {
          <h2 class="font-semibold mb-2">Published versions</h2>
          <div class="space-y-2" id="privacy-versions">
            @for (v of s.versions; track v.version) {
              <div class="bg-white rounded-xl border border-outline-variant p-3">
                <button type="button" class="text-sm font-semibold text-left w-full" [attr.data-version]="v.version" (click)="open(v.version)">
                  Version {{ v.version }} · {{ v.publishedAt | date: 'd MMM y, h:mm a' }}</button>
                @if (shown()?.version === v.version) {
                  <div class="mt-2 whitespace-pre-line text-xs text-slate-700">{{ shown()?.body }}</div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class PrivacyPageComponent implements OnInit {
  private privacy = inject(PrivacyService);
  private toast = inject(ToastService);

  readonly s = signal<PrivacySettings | null>(null);
  readonly shown = signal<PrivacyNotice | null>(null);
  officerName = '';
  officerEmail = '';
  officerPhone = '';
  consentAge = 18;
  draft = '';

  get nextVersion(): number {
    return (this.s()?.versions[0]?.version ?? 0) + 1;
  }

  ngOnInit(): void {
    this.privacy.settings().subscribe({ next: (s) => this.show(s) });
  }

  private show(s: PrivacySettings): void {
    this.s.set(s);
    this.officerName = s.officer.name ?? '';
    this.officerEmail = s.officer.email ?? '';
    this.officerPhone = s.officer.phone ?? '';
    this.consentAge = s.consentAge;
    this.draft = s.notice.body;
  }

  save(): void {
    this.privacy.saveSettings({ officerName: this.officerName.trim() || null, officerEmail: this.officerEmail.trim() || null,
      officerPhone: this.officerPhone.trim() || null, consentAge: this.consentAge }).subscribe({
      next: (s) => {
        // A built-in notice names the officer, so it changes with them; a draft being written is kept.
        const editing = this.draft !== this.s()?.notice.body;
        const draft = this.draft;
        this.show(s);
        if (editing) this.draft = draft;
        this.toast.success('Privacy settings saved');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  publish(): void {
    this.privacy.publish(this.draft).subscribe({
      next: (n) => {
        this.toast.success(`Version ${n.version} published`);
        this.privacy.settings().subscribe({ next: (s) => this.show(s) });
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not published.'),
    });
  }

  open(version: number): void {
    if (this.shown()?.version === version) {
      this.shown.set(null);
      return;
    }
    this.privacy.notice(version).subscribe({ next: (n) => this.shown.set(n) });
  }
}
