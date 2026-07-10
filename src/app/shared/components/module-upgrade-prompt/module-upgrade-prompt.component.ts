import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-module-upgrade-prompt',
  standalone: true,
  imports: [],
  template: `
    <div
      class="flex flex-col items-center justify-center py-12 px-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
    >
      <div class="text-4xl mb-3">🔒</div>
      <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ moduleName }} Module</h3>
      <p class="text-sm text-gray-600 text-center max-w-sm mb-4">
        This module is not available in your current <strong>{{ planName }}</strong> plan. Upgrade
        to unlock access to {{ moduleName }} and more features.
      </p>
      <a
        href="https://admin.codeatcloud.com"
        target="_blank"
        class="px-5 py-2.5 text-sm font-medium text-white bg-[#003d9b] rounded-lg hover:bg-[#002d75] transition-colors"
        >Upgrade Plan</a
      >
    </div>
  `,
})
export class ModuleUpgradePromptComponent {
  @Input() moduleCode = '';
  @Input() moduleName = '';
  @Input() planName = 'Current';
}
