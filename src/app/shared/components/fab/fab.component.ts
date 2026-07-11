import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutStore } from '../../../core/store/layout.store';

@Component({
  selector: 'app-fab',
  template: `
    @if (config()) {
      <button
        [routerLink]="config()?.route || null"
        (click)="onFabClick()"
        class="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-2xl bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-light active:scale-95 transition-all"
        [attr.aria-label]="config()?.label"
      >
        <span class="material-symbols-outlined text-[28px]">{{ config()?.icon }}</span>
      </button>
    }
  `,
  imports: [RouterLink],
})
export class FabComponent {
  private layoutStore = inject(LayoutStore);
  readonly config = this.layoutStore.fabConfig;

  onFabClick(): void {
    this.config()?.action?.();
  }
}
