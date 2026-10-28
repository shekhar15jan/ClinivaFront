import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: ToastType = 'info', duration = 4000): void {
    // Several calls failing together (for example a module that is not on the plan) would stack the same
    // message many times: one copy on screen is enough, and it can be shown again once it is gone.
    if (this.toastsSignal().some(t => t.message === message && t.type === type)) {
      return;
    }
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };
    this.toastsSignal.set([...this.toastsSignal(), toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 6000): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 5000): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  dismiss(id: string): void {
    this.toastsSignal.set(this.toastsSignal().filter(t => t.id !== id));
  }

  clear(): void {
    this.toastsSignal.set([]);
  }
}
