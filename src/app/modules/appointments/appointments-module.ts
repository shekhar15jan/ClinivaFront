import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { AppointmentsRoutingModule } from './appointments-routing-module';
import { AppointmentCalendar } from './pages/appointment-calendar/appointment-calendar';
import { BookingFlow } from './pages/booking-flow/booking-flow';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppointmentsRoutingModule,
    AppointmentCalendar,
    BookingFlow,
  ],
})
export class AppointmentsModule {}
