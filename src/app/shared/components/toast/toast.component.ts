import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 animate-slide-in"
          [ngClass]="getToastClasses(toast)"
          (click)="toastService.dismiss(toast.id)"
          (keydown.enter)="toastService.dismiss(toast.id)"
          (keydown.space)="toastService.dismiss(toast.id); $event.preventDefault()"
          tabindex="0"
          role="alert"
        >
          <span class="text-lg leading-none mt-0.5">{{ getIcon(toast) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button
            class="text-current opacity-60 hover:opacity-100 text-lg leading-none"
            (click)="$event.stopPropagation(); toastService.dismiss(toast.id)"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);

  getToastClasses(toast: Toast): Record<string, boolean> {
    return {
      'bg-green-50 text-green-800 border border-green-200': toast.type === 'success',
      'bg-red-50 text-red-800 border border-red-200': toast.type === 'error',
      'bg-amber-50 text-amber-800 border border-amber-200': toast.type === 'warning',
      'bg-blue-50 text-blue-800 border border-blue-200': toast.type === 'info',
      'cursor-pointer': true,
    };
  }

  getIcon(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return '\u2713';
      case 'error':
        return '\u2717';
      case 'warning':
        return '\u26A0';
      case 'info':
        return '\u2139';
    }
  }
}
