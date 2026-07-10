import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoctorList } from './pages/doctor-list/doctor-list';
import { DoctorDetail } from './pages/doctor-detail/doctor-detail';
import { DoctorForm } from './pages/doctor-form/doctor-form';

const routes: Routes = [
  { path: '', component: DoctorList },
  { path: 'new', component: DoctorForm },
  { path: ':id', component: DoctorDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DoctorsRoutingModule {}
