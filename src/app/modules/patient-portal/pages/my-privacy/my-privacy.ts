import { Component, OnInit, inject, signal } from '@angular/core';
import { PrivacyService, PublicPrivacy } from '../../../../core/services/privacy.service';
import { TenantContextService } from '../../../../core/services/tenant-context.service';
import { PatientConsentsComponent } from '../../../privacy/patient-consents';

/** The patient's privacy page: the clinic's notice, who to contact, and their own choices, which they can change. */
@Component({
  selector: 'app-my-privacy',
  standalone: true,
  imports: [PatientConsentsComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl space-y-4">
      <h1 class="text-2xl font-semibold text-on-surface">Privacy</h1>
      <app-patient-consents [canEdit]="true"></app-patient-consents>
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

  readonly info = signal<PublicPrivacy | null>(null);

  ngOnInit(): void {
    const code = this.tenantContext.tenantCode();
    if (code) this.privacy.publicView(code).subscribe({ next: (p) => this.info.set(p) });
  }
}
