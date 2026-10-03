import { NgModule } from '@angular/core';
import { CanActivateFn, Router, RouterModule, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentCalendar } from './pages/appointment-calendar/appointment-calendar';
import { BookingFlow } from './pages/booking-flow/booking-flow';

/** Booking and changing appointments needs APPOINTMENT_MANAGE (the API refuses others). */
const frontDeskOnly: CanActivateFn = (route) => {
  return inject(AuthService).can('APPOINTMENT_MANAGE') ? true
    : inject(Router).createUrlTree(['/', route.parent?.parent?.params['hospitalCode'] ?? '', 'appointments']);
};

const routes: Routes = [
  { path: '', component: AppointmentCalendar },
  { path: 'book', component: BookingFlow, canActivate: [frontDeskOnly] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule { }
