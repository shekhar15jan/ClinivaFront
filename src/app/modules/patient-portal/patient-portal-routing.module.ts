import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PatientDashboard } from './pages/patient-dashboard/patient-dashboard';
import { MyAppointments } from './pages/my-appointments/my-appointments';
import { MyPrescriptions } from './pages/my-prescriptions/my-prescriptions';
import { MyBills } from './pages/my-bills/my-bills';
import { MyProfile } from './pages/my-profile/my-profile';

const routes: Routes = [
  { path: 'dashboard', component: PatientDashboard },
  { path: 'appointments', component: MyAppointments },
  { path: 'prescriptions', component: MyPrescriptions },
  { path: 'bills', component: MyBills },
  { path: 'profile', component: MyProfile },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PatientPortalRoutingModule {}
