import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentCalendar } from './pages/appointment-calendar/appointment-calendar';
import { BookingFlow } from './pages/booking-flow/booking-flow';

const routes: Routes = [
  { path: '', component: AppointmentCalendar },
  { path: 'book', component: BookingFlow }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
