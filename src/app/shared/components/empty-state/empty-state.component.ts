import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <div class="text-5xl mb-4 text-gray-300">{{ icon }}</div>
      <h3 class="text-lg font-semibold text-gray-700 mb-1">{{ title }}</h3>
      <p class="text-sm text-gray-500 text-center max-w-sm mb-4">{{ description }}</p>
      @if (actionLabel) {
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-[#003d9b] rounded-lg hover:bg-[#002d75] transition-colors"
          (click)="action.emit()"
        >
          {{ actionLabel }}
        </button>
      }
      <!-- Buttons placed between the tags, e.g. <app-empty-state><button>Create</button></app-empty-state>. -->
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = '\uD83D\uDCCB';
  @Input() title = 'No data found';
  @Input() description = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
