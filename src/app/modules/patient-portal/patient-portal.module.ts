import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PatientPortalRoutingModule } from './patient-portal-routing.module';
import { PatientDashboard } from './pages/patient-dashboard/patient-dashboard';
import { MyAppointments } from './pages/my-appointments/my-appointments';
import { MyPrescriptions } from './pages/my-prescriptions/my-prescriptions';
import { MyBills } from './pages/my-bills/my-bills';
import { MyProfile } from './pages/my-profile/my-profile';

@NgModule({
  imports: [CommonModule, PatientPortalRoutingModule, PatientDashboard, MyAppointments, MyPrescriptions, MyBills, MyProfile],
})
export class PatientPortalModule {}
