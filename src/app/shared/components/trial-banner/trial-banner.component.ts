import { Component, computed, inject } from '@angular/core';

import { EffectiveLicenseService } from '../../../core/services/effective-license.service';

@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [],
  template: `
    @if (isVisible()) {
      <div
        class="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between"
      >
        <div class="flex items-center gap-2 text-sm">
          <span class="text-amber-600 text-lg">⏳</span>
          <span class="text-amber-800 font-medium">
            Trial: {{ daysRemaining() }} days remaining
          </span>
          <span class="text-amber-600">|</span>
          <span class="text-amber-700">Plan: {{ licenseService.planName() }}</span>
        </div>
        <a
          href="https://admin.codeatcloud.com"
          target="_blank"
          class="px-3 py-1 text-xs font-medium text-white bg-amber-600 rounded-full hover:bg-amber-700 transition-colors"
          >Upgrade Now</a
        >
      </div>
    }
  `,
})
export class TrialBannerComponent {
  licenseService = inject(EffectiveLicenseService);

  readonly isVisible = computed(() => this.licenseService.isTrial());

  readonly daysRemaining = computed(() => {
    const endsAt = this.licenseService.trialEndsAt();
    if (!endsAt) return 0;
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });
}
