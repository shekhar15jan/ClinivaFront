import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { AuthGuard } from './core/guards/auth.guard';
import { TenantResolverGuard } from './core/guards/tenant-resolver.guard';
import { ModuleGuard } from './core/guards/module.guard';
import { RoleGuard } from './core/guards/role-guard';
import { NotFoundComponent } from './shared/pages/not-found/not-found';

const routes: Routes = [
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
        children: [
          { path: 'dashboard', loadChildren: () => import('./modules/dashboard/dashboard-module').then(m => m.DashboardModule) },
          {
            path: 'patients',
            loadChildren: () => import('./modules/patients/patients-module').then(m => m.PatientsModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'PATIENT' }
          },
          {
            path: 'appointments',
            loadChildren: () => import('./modules/appointments/appointments-module').then(m => m.AppointmentsModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'APPOINTMENT' }
          },
          {
            path: 'consultations',
            loadChildren: () => import('./modules/consultations/consultations-module').then(m => m.ConsultationsModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'CONSULTATION' }
          },
          {
            path: 'billing',
            loadChildren: () => import('./modules/billing/billing-module').then(m => m.BillingModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'BILLING' }
          },
          {
            path: 'doctors',
            loadChildren: () => import('./modules/doctors/doctors-module').then(m => m.DoctorsModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'DOCTOR' }
          },
          {
            path: 'medicines',
            loadChildren: () => import('./modules/medicines/medicines-module').then(m => m.MedicinesModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'MEDICINE' }
          },
          {
            path: 'prescriptions',
            loadChildren: () => import('./modules/prescriptions/prescriptions-module').then(m => m.PrescriptionsModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'PRESCRIPTION' }
          },
          {
            path: 'reports',
            loadChildren: () => import('./modules/reports/reports-module').then(m => m.ReportsModule),
            canActivate: [ModuleGuard],
            data: { moduleCode: 'REPORTS' }
          },
          { path: 'settings', loadChildren: () => import('./modules/settings/settings-module').then(m => m.SettingsModule) },
          {
            path: 'users',
            loadChildren: () => import('./modules/users/users-module').then(m => m.UsersModule),
            canActivate: [RoleGuard],
            data: { roles: ['ADMIN'] }
          },
          {
            path: 'audit-logs',
            loadChildren: () => import('./modules/audit-logs/audit-logs-module').then(m => m.AuditLogsModule),
            canActivate: [RoleGuard],
            data: { roles: ['ADMIN'] }
          },
          { path: 'payments', loadChildren: () => import('./modules/payments/payments.module').then(m => m.PaymentsModule) },
          { path: 'health-packages', loadChildren: () => import('./modules/health-packages/health-packages.module').then(m => m.HealthPackagesModule) },
          { path: 'contacts', loadChildren: () => import('./modules/contacts/contacts.module').then(m => m.ContactsModule) },
          { path: 'reviews', loadChildren: () => import('./modules/reviews/reviews.module').then(m => m.ReviewsModule) },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
      }
    ]
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
