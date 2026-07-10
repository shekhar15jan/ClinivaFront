import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { PatientsRoutingModule } from './patients-routing-module';
import { PatientList } from './pages/patient-list/patient-list';
import { PatientDetail } from './pages/patient-detail/patient-detail';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, PatientsRoutingModule, PatientList, PatientDetail],
})
export class PatientsModule {}
