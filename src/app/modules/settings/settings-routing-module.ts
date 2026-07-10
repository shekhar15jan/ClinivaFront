import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClinicSettingsPage } from './pages/clinic-settings/clinic-settings';

const routes: Routes = [
  { path: '', component: ClinicSettingsPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
