import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="fixed bottom-0 left-0 w-full z-50 md:hidden bg-surface/80 backdrop-blur-lg border-t border-outline-variant shadow-nav-up rounded-t-xl">
      <div class="flex justify-around items-center h-16 px-2">
        @for (item of navItems(); track item.code) {
          <a
            [routerLink]="item.route"
            routerLinkActive="text-primary"
            [routerLinkActiveOptions]="{ exact: item.exact || false }"
            class="flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-touch py-1 px-2 rounded-xl transition-colors text-on-surface-variant"
          >
            <span class="material-symbols-outlined text-[24px]">{{ item.icon }}</span>
            <span class="text-[11px] font-medium leading-none">{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
  `,
  imports: [RouterLink, RouterLinkActive],
})
export class BottomNav {
  private authService = inject(AuthService);

  readonly isPatient = computed(() => this.authService.currentUserValue?.role === 'PATIENT');

  readonly staffItems = [
    { code: 'DASHBOARD', label: 'Home', icon: 'home', route: 'dashboard', exact: true },
    { code: 'APPOINTMENT', label: 'Schedule', icon: 'calendar_today', route: 'appointments' },
    { code: 'PATIENT', label: 'Patients', icon: 'groups', route: 'patients' },
    { code: 'SETTINGS', label: 'Settings', icon: 'settings', route: 'settings' },
  ];

  readonly patientItems = [
    { code: 'DASHBOARD', label: 'Home', icon: 'home', route: 'patient/dashboard', exact: true },
    { code: 'APPOINTMENT', label: 'Appointments', icon: 'calendar_today', route: 'patient/appointments' },
    { code: 'PRESCRIPTION', label: 'Rx', icon: 'receipt_long', route: 'patient/prescriptions' },
    { code: 'PROFILE', label: 'Profile', icon: 'person', route: 'patient/profile' },
  ];

  readonly navItems = computed(() => this.isPatient() ? this.patientItems : this.staffItems);
}
