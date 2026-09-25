import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { AuthGuard } from './core/guards/auth.guard';
import { TenantResolverGuard } from './core/guards/tenant-resolver.guard';
import { screenGuard } from './core/guards/screen.guard';
import { NotFoundComponent } from './shared/pages/not-found/not-found';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./auth/generic-login-module').then(m => m.GenericLoginModule) },
  {
    path: ':hospitalCode',
    canActivate: [TenantResolverGuard],
    children: [
      { path: '', loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule) },
      { path: 'onboarding', loadChildren: () => import('./auth/onboarding-module').then(m => m.OnboardingModule), canActivate: [AuthGuard] },
      {
        path: '',
        component: Shell,
        canActivate: [AuthGuard],
        // Role + plan for every screen, from the same table as the menu.
        canActivateChild: [screenGuard],
        children: [
          { path: 'dashboard', loadChildren: () => import('./modules/dashboard/dashboard-module').then(m => m.DashboardModule) },
          {
            path: 'patients',
            loadChildren: () => import('./modules/patients/patients-module').then(m => m.PatientsModule)
          },
          {
            path: 'appointments',
            loadChildren: () => import('./modules/appointments/appointments-module').then(m => m.AppointmentsModule)
          },
          {
            path: 'consultations',
            loadChildren: () => import('./modules/consultations/consultations-module').then(m => m.ConsultationsModule)
          },
          {
            path: 'billing',
            loadChildren: () => import('./modules/billing/billing-module').then(m => m.BillingModule)
          },
          {
            path: 'doctors',
            loadChildren: () => import('./modules/doctors/doctors-module').then(m => m.DoctorsModule)
          },
          {
            path: 'medicines',
            loadChildren: () => import('./modules/medicines/medicines-module').then(m => m.MedicinesModule)
          },
          {
            path: 'prescriptions',
            loadChildren: () => import('./modules/prescriptions/prescriptions-module').then(m => m.PrescriptionsModule)
          },
          {
            path: 'reports',
            loadChildren: () => import('./modules/reports/reports-module').then(m => m.ReportsModule)
          },
          { path: 'settings', loadChildren: () => import('./modules/settings/settings-module').then(m => m.SettingsModule) },
          {
            path: 'users',
            loadChildren: () => import('./modules/users/users-module').then(m => m.UsersModule)
          },
          {
            path: 'audit-logs',
            loadChildren: () => import('./modules/audit-logs/audit-logs-module').then(m => m.AuditLogsModule)
          },
          { path: 'payments', loadChildren: () => import('./modules/payments/payments.module').then(m => m.PaymentsModule) },
          { path: 'health-packages', loadChildren: () => import('./modules/health-packages/health-packages.module').then(m => m.HealthPackagesModule) },
          { path: 'contacts', loadChildren: () => import('./modules/contacts/contacts.module').then(m => m.ContactsModule) },
          { path: 'reviews', loadChildren: () => import('./modules/reviews/reviews.module').then(m => m.ReviewsModule) },
          {
            path: 'patient',
            loadChildren: () => import('./modules/patient-portal/patient-portal.module').then(m => m.PatientPortalModule)
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      }
    ]
  },
  { path: '**', component: NotFoundComponent }
];
