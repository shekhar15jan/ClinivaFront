import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-[9997] flex items-center justify-center bg-black/40" (click)="onCancel()" (keydown.enter)="onCancel()" (keydown.space)="onCancel(); $event.preventDefault()" tabindex="0">
        <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" (click)="$event.stopPropagation()" (keydown.enter)="$event.stopPropagation()" (keydown.space)="$event.stopPropagation()" tabindex="-1">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ title }}</h3>
          <p class="text-sm text-gray-600 mb-6">{{ message }}</p>
          <div class="flex justify-end gap-3">
            <button
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              (click)="onCancel()"
            >{{ cancelText }}</button>
            <button
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              [ngClass]="isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#003d9b] hover:bg-[#002d75]'"
              (click)="onConfirm()"
            >{{ confirmText }}</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() isDestructive = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
    this.open = false;
  }

  onCancel(): void {
    this.cancelled.emit();
    this.open = false;
  }
}
