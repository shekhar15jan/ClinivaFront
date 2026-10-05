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
          { path: 'abdm', loadComponent: () => import('./modules/abdm/abdm-setup').then(m => m.AbdmSetupComponent) },
          {
            path: 'insurance',
            children: [
              { path: '', loadComponent: () => import('./modules/insurance/insurance-desk').then(m => m.InsuranceDeskComponent) },
              { path: ':id', loadComponent: () => import('./modules/insurance/claim-detail').then(m => m.ClaimDetailComponent) },
            ]
          },
          {
            path: 'lab',
            children: [
              { path: '', loadComponent: () => import('./modules/lab/lab-worklist').then(m => m.LabWorklistComponent) },
              { path: 'new', loadComponent: () => import('./modules/lab/lab-new-order').then(m => m.LabNewOrderComponent) },
              { path: 'tests', loadComponent: () => import('./modules/lab/lab-catalog').then(m => m.LabCatalogComponent) },
              { path: ':id', loadComponent: () => import('./modules/lab/lab-order').then(m => m.LabOrderComponent) },
            ]
          },
          {
            path: 'payouts',
            children: [
              { path: '', loadComponent: () => import('./modules/payouts/payouts-page').then(m => m.PayoutsPageComponent) },
              { path: ':id', loadComponent: () => import('./modules/payouts/payout-statement').then(m => m.PayoutStatementComponent) },
            ]
          },
          { path: 'hr-link', loadComponent: () => import('./modules/hr-link/hr-link-page').then(m => m.HrLinkPageComponent) },
          { path: 'my-payouts', loadComponent: () => import('./modules/payouts/my-payouts').then(m => m.MyPayoutsComponent) },
          { path: 'analytics', loadComponent: () => import('./modules/analytics/analytics-page').then(m => m.AnalyticsPageComponent) },
          {
            path: 'ot',
            children: [
              { path: '', loadComponent: () => import('./modules/ot/ot-board').then(m => m.OtBoardComponent) },
              { path: 'new', loadComponent: () => import('./modules/ot/ot-book').then(m => m.OtBookComponent) },
              { path: ':id', loadComponent: () => import('./modules/ot/ot-surgery').then(m => m.OtSurgeryComponent) },
            ]
          },
          {
            path: 'radiology',
            children: [
              { path: '', loadComponent: () => import('./modules/radiology/radiology-worklist').then(m => m.RadiologyWorklistComponent) },
              { path: 'new', loadComponent: () => import('./modules/radiology/radiology-new-order').then(m => m.RadiologyNewOrderComponent) },
              { path: 'studies', loadComponent: () => import('./modules/radiology/radiology-catalog').then(m => m.RadiologyCatalogComponent) },
              { path: ':id', loadComponent: () => import('./modules/radiology/radiology-order').then(m => m.RadiologyOrderComponent) },
            ]
          },
          { path: 'stock', loadComponent: () => import('./modules/stock/stock-page').then(m => m.StockPageComponent) },
          {
            path: 'nursing',
            children: [
              { path: '', loadComponent: () => import('./modules/nursing/ward-round').then(m => m.WardRoundComponent) },
              { path: ':admissionId', loadComponent: () => import('./modules/nursing/nursing-chart').then(m => m.NursingChartComponent) },
            ]
          },
          {
            path: 'ipd',
            children: [
              { path: '', loadComponent: () => import('./modules/ipd/bed-board').then(m => m.BedBoardComponent) },
              { path: 'admissions', loadComponent: () => import('./modules/ipd/admission-list').then(m => m.AdmissionListComponent) },
              { path: 'admissions/:id', loadComponent: () => import('./modules/ipd/admission-detail').then(m => m.AdmissionDetailComponent) },
              { path: 'wards', loadComponent: () => import('./modules/ipd/ward-setup').then(m => m.WardSetupComponent) },
            ]
          },
          { path: 'departments', loadComponent: () => import('./modules/departments/department-list').then(m => m.DepartmentListComponent) },
          { path: 'roles', loadComponent: () => import('./modules/roles/role-list').then(m => m.RoleListComponent) },
          {
            path: 'emergency-access',
            loadComponent: () => import('./modules/emergency-access/emergency-access-list').then(m => m.EmergencyAccessListComponent)
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
