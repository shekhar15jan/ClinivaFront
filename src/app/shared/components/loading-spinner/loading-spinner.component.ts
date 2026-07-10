import { Component, Input, inject } from '@angular/core';

import { LayoutStore } from '../../../core/store/layout.store';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [],
  template: `
    @if (layoutStore.isLoading()) {
      <div
        class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/10 backdrop-blur-[1px]"
      >
        <div class="flex flex-col items-center gap-3 bg-white rounded-xl px-8 py-6 shadow-lg">
          <div
            class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"
          ></div>
          @if (message) {
            <span class="text-sm text-gray-600">{{ message }}</span>
          }
        </div>
      </div>
    }
  `,
})
export class LoadingSpinnerComponent {
  layoutStore = inject(LayoutStore);

  @Input() message = '';
}
