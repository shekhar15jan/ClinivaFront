import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { AuthService } from '../../core/services/auth.service';
import { STAFF_NAV, canSee } from '../nav-items';

@Component({
  selector: 'app-mobile-drawer',
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 md:hidden">
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          (click)="closed.emit()"
          (keydown.enter)="closed.emit()"
          role="presentation"
          tabindex="0"
        ></div>
        <div class="absolute left-0 top-0 h-full w-72 bg-surface shadow-2xl animate-slide-in-left">
          <div class="flex flex-col h-full">
            <div class="px-5 py-5 border-b border-outline-variant flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="bg-primary p-1.5 rounded-lg">
                  <span class="material-symbols-outlined text-white text-[24px]">medical_services</span>
                </div>
                <h1 class="text-lg font-bold text-primary">Cliniva HMS</h1>
              </div>
              <button (click)="closed.emit()" class="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav class="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              @for (item of navItems; track item.route) {
                @if (isVisible(item)) {
                  <a
                    [routerLink]="item.route"
                    (click)="closed.emit()"
                    routerLinkActive="bg-primary/5 text-primary font-bold border-l-4 border-primary"
                    class="flex items-center gap-3 px-3 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors border-l-4 border-transparent"
                  >
                    <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
                    <span class="text-sm font-medium">{{ item.label }}</span>
                  </a>
                }
              }
            </nav>

            @if (authService.currentUser(); as user) {
              <div class="p-4 border-t border-outline-variant">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold uppercase">
                    {{ ((user.profile?.['firstName']?.charAt(0) ?? '') + (user.profile?.['lastName']?.charAt(0) ?? '')) || '?' }}
                  </div>
                  <div class="flex-1 overflow-hidden">
                    <p class="text-sm font-medium text-on-surface truncate">{{ user.profile?.['firstName'] || user.email }}</p>
                    <p class="text-xs text-outline truncate">{{ user.role }}</p>
                  </div>
                </div>
                <button
                  routerLink="/auth/login"
                  (click)="closed.emit()"
                  class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-error border border-error/20 rounded-lg hover:bg-error/5 transition-colors"
                >
                  <span class="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideInLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    .animate-slide-in-left {
      animation: slideInLeft 0.25s ease-out;
    }
  `],
  imports: [RouterLink, RouterLinkActive],
})
export class MobileDrawer {
  private effectiveLicense = inject(EffectiveLicenseService);
  protected authService = inject(AuthService);

  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  readonly activeModules = this.effectiveLicense.activeModules;

  readonly navItems = STAFF_NAV;

  isVisible(item: (typeof STAFF_NAV)[number]): boolean {
    return canSee(item, this.authService.currentUserValue?.role ?? '', this.activeModules());
  }
}
