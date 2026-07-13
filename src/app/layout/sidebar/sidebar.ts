import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { AuthService } from '../../core/services/auth.service';

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

  readonly staffNavItems = [
    { code: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { code: 'PATIENT', label: 'Patients', icon: 'person', route: 'patients' },
    { code: 'DOCTOR', label: 'Doctors', icon: 'medical_services', route: 'doctors' },
    { code: 'APPOINTMENT', label: 'Appointments', icon: 'event', route: 'appointments' },
    { code: 'CONSULTATION', label: 'Consultations', icon: 'stethoscope', route: 'consultations' },
    { code: 'PRESCRIPTION', label: 'Prescriptions', icon: 'receipt_long', route: 'prescriptions' },
    { code: 'BILLING', label: 'Billing', icon: 'payments', route: 'billing' },
    { code: 'MEDICINE', label: 'Pharmacy', icon: 'medication', route: 'medicines' },
    { code: 'REPORTS', label: 'Reports', icon: 'bar_chart', route: 'reports' },
    { code: 'HEALTH_PACKAGE', label: 'Health Packages', icon: 'card_giftcard', route: 'health-packages' },
    { code: 'SETTINGS', label: 'Settings', icon: 'settings', route: 'settings' },
  ];

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

  isVisible(item: { code: string }) {
    if (this.isPatient()) return true;
    return item.code === 'DASHBOARD' || this.activeModules().includes(item.code);
  }
}
