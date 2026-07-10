import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { DoctorsRoutingModule } from './doctors-routing-module';
import { DoctorList } from './pages/doctor-list/doctor-list';
import { DoctorDetail } from './pages/doctor-detail/doctor-detail';
import { DoctorForm } from './pages/doctor-form/doctor-form';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DoctorsRoutingModule,
    DoctorList,
    DoctorDetail,
    DoctorForm,
  ],
})
export class DoctorsModule {}
