import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { AuthService } from '../../core/services/auth.service';
import { NavItem, STAFF_NAV, canSee } from '../nav-items';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  imports: [RouterLink, RouterLinkActive],
})
export class Sidebar {
  private effectiveLicense = inject(EffectiveLicenseService);
  private router = inject(Router);
  protected authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  readonly activeModules = this.effectiveLicense.activeModules;
  readonly userRole = computed(() => this.authService.currentUserValue?.role || '');
  readonly isPatient = computed(() => this.userRole() === 'PATIENT');

  readonly staffNavItems = STAFF_NAV;

  readonly patientNavItems = [
    { code: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard', route: 'patient/dashboard' },
    { code: 'APPOINTMENT', label: 'My Appointments', icon: 'event', route: 'patient/appointments' },
    { code: 'PRESCRIPTION', label: 'My Prescriptions', icon: 'receipt_long', route: 'patient/prescriptions' },
    { code: 'BILLING', label: 'My Bills', icon: 'payments', route: 'patient/bills' },
    { code: 'SETTINGS', label: 'My Profile', icon: 'person', route: 'patient/profile' },
  ];

  readonly navItems = computed(() =>
    this.isPatient() ? this.patientNavItems : this.staffNavItems
  );

  isVisible(item: NavItem) {
    if (this.isPatient()) return true;
    return canSee(item, this.userRole(), this.activeModules());
  }
}
