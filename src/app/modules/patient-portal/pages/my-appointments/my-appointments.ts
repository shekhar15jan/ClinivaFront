import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-appointments',
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 class="text-headline-md text-on-surface">My Appointments</h2>
        <button (click)="showBooking = !showBooking" class="bg-primary text-primary-on px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light flex items-center gap-2 shrink-0">
          <span class="material-symbols-outlined text-lg">add</span> Book Appointment
        </button>
      </div>

      @if (showBooking) {
        <div class="bg-white rounded-xl border border-outline-variant p-4 sm:p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">Book New Appointment</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label for="bookingDate2" class="block text-sm font-medium text-gray-700 mb-1">Date</label><input id="bookingDate2" type="date" [(ngModel)]="bookingDate" class="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label for="bookingTime2" class="block text-sm font-medium text-gray-700 mb-1">Time</label><input id="bookingTime2" type="time" [(ngModel)]="bookingTime" class="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div class="mb-4">
            <label for="bookingReason2" class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <input id="bookingReason2" type="text" [(ngModel)]="bookingReason" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Reason for visit" />
          </div>
          @if (bookingError) { <p class="text-sm text-red-600 mb-3">{{ bookingError }}</p> }
          <div class="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button (click)="showBooking = false" class="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button (click)="bookAppointment()" [disabled]="isBooking" class="px-5 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50">{{ isBooking ? 'Booking...' : 'Confirm' }}</button>
          </div>
        </div>
      }

      @if (isLoading) {
        <div class="flex justify-center py-12"><div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div></div>
      } @else if (appointments.length === 0) {
        <div class="text-center py-12 text-sm text-outline">No appointments found.</div>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div class="hidden md:block">
            <table class="w-full">
              <thead><tr class="bg-surface-container text-left">
                <th class="px-4 py-3 text-xs font-semibold uppercase">Date</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Time</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Token #</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Status</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Actions</th>
              </tr></thead>
              <tbody>
                @for (apt of appointments; track apt.id) {
                  <tr class="border-t border-outline-variant">
                    <td class="px-4 py-3 text-sm text-on-surface">{{ apt.appointmentDate | date:'mediumDate' }}</td>
                    <td class="px-4 py-3 text-sm text-on-surface-variant">{{ apt.appointmentTime }}</td>
                    <td class="px-4 py-3 text-sm font-mono">#{{ apt.tokenNumber }}</td>
                    <td class="px-4 py-3"><span [class]="statusClass(apt.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ apt.status }}</span></td>
                    <td class="px-4 py-3">
                      @if (apt.status === 'PENDING') {
                        <button (click)="cancelAppointment(apt.id)" class="text-sm text-red-600 hover:underline">Cancel</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="md:hidden divide-y divide-outline-variant">
            @for (apt of appointments; track apt.id) {
              <div class="px-4 py-3.5 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-on-surface">{{ apt.appointmentDate | date:'mediumDate' }} at {{ apt.appointmentTime }}</span>
                  <span [class]="statusClass(apt.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ apt.status }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-outline">Token #{{ apt.tokenNumber }}</span>
                  @if (apt.status === 'PENDING') {
                    <button (click)="cancelAppointment(apt.id)" class="text-xs text-red-600 hover:underline">Cancel</button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  imports: [DatePipe, FormsModule],
})
export class MyAppointments implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  appointments: Appointment[] = [];
  isLoading = false;
  showBooking = false;
  bookingDate = '';
  bookingTime = '';
  bookingReason = '';
  bookingError = '';
  isBooking = false;

  ngOnInit() { this.loadAppointments(); }

  loadAppointments() {
    const patientId = this.authService.currentUserValue?.id || '';
    this.isLoading = true;
    this.appointmentService.getPatientAppointments(patientId).subscribe({
      next: (res) => { if (res.success) { this.appointments = res.data || []; } this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  bookAppointment() {
    if (!this.bookingDate || !this.bookingTime) { this.bookingError = 'Date and time are required'; return; }
    this.isBooking = true; this.bookingError = '';
    this.appointmentService.createAppointment({
      patientId: this.authService.currentUserValue?.id || '', doctorId: '',
      appointmentDate: this.bookingDate, appointmentTime: this.bookingTime, reason: this.bookingReason,
    }).subscribe({
      next: (res) => { if (res.success) { this.showBooking = false; this.loadAppointments(); } this.isBooking = false; },
      error: (err) => { this.bookingError = err?.message || 'Booking failed'; this.isBooking = false; },
    });
  }

  cancelAppointment(id: string) {
    this.appointmentService.cancelAppointment(id).subscribe({ next: () => this.loadAppointments() });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'APPROVED': case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}
