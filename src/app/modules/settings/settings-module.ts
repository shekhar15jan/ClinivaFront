import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsRoutingModule } from './settings-routing-module';
import { ClinicSettingsPage } from './pages/clinic-settings/clinic-settings';

@NgModule({
  imports: [CommonModule, FormsModule, SettingsRoutingModule, ClinicSettingsPage],
})
export class SettingsModule {}
