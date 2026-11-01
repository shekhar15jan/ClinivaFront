import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClinicSettingsPage } from './pages/clinic-settings/clinic-settings';
import { EmailTemplatesPage } from './pages/email-templates/email-templates';

const routes: Routes = [
  { path: '', component: ClinicSettingsPage },
  { path: 'plan', loadComponent: () => import('./pages/plan/plan-page').then(m => m.PlanPage) },
  { path: 'email-templates', component: EmailTemplatesPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
