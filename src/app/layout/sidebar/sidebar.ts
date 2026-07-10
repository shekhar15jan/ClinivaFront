import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  protected authService = inject(AuthService);

  readonly activeModules = this.effectiveLicense.activeModules;

  readonly navItems = [
    { code: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard', route: 'dashboard' },
    { code: 'PATIENT', label: 'Patients', icon: 'person', route: 'patients' },
    { code: 'DOCTOR', label: 'Doctors', icon: 'medical_services', route: 'doctors' },
    { code: 'APPOINTMENT', label: 'Appointments', icon: 'event', route: 'appointments' },
    { code: 'CONSULTATION', label: 'Consultations', icon: 'stethoscope', route: 'consultations' },
    { code: 'PRESCRIPTION', label: 'Prescriptions', icon: 'receipt_long', route: 'prescriptions' },
    { code: 'BILLING', label: 'Billing', icon: 'payments', route: 'billing' },
    { code: 'PAYMENT', label: 'Payments', icon: 'account_balance_wallet', route: 'billing' },
    { code: 'MEDICINE', label: 'Pharmacy', icon: 'medication', route: 'medicines' },
    { code: 'REPORTS', label: 'Reports', icon: 'bar_chart', route: 'reports' },
    { code: 'HEALTH_PACKAGE', label: 'Health Packages', icon: 'card_giftcard', route: 'health-packages' },
    { code: 'SETTINGS', label: 'Settings', icon: 'settings', route: 'settings' },
  ];
}
