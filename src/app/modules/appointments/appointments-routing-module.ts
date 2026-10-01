import { NgModule } from '@angular/core';
import { CanActivateFn, Router, RouterModule, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentCalendar } from './pages/appointment-calendar/appointment-calendar';
import { BookingFlow } from './pages/booking-flow/booking-flow';

/** Booking and changing appointments is for the front desk and administrators (the API refuses others). */
const frontDeskOnly: CanActivateFn = (route) => {
  const role = inject(AuthService).currentUserValue?.role;
  return role === 'ADMIN' || role === 'RECEPTIONIST' ? true
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
