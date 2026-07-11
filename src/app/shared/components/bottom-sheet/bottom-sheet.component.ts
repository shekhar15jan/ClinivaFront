import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-bottom-sheet',
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-end justify-center">
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          (click)="onBackdropClick()"
          role="presentation"
        ></div>
        <div
          class="relative w-full max-w-lg bg-surface rounded-t-3xl shadow-level-2 animate-slide-up max-h-[90vh] overflow-y-auto"
          [style.animation]="'slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)'"
        >
          <div class="sticky top-0 bg-surface rounded-t-3xl pt-3 pb-1 z-10">
            <div class="flex justify-center mb-2">
              <div class="w-10 h-1 bg-outline-variant rounded-full"></div>
            </div>
            @if (title) {
              <div class="flex items-center justify-between px-5 pb-3">
                <h2 class="text-headline-md text-on-surface">{{ title }}</h2>
                @if (showCloseButton) {
                  <button (click)="closed.emit()" class="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg">
                    <span class="material-symbols-outlined">close</span>
                  </button>
                }
              </div>
            }
          </div>
          <div class="px-5 pb-8">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `],
})
export class BottomSheetComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() showCloseButton = true;
  @Output() closed = new EventEmitter<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }
}
