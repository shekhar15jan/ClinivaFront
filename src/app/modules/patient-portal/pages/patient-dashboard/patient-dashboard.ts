import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { BillingService } from '../../../../core/services/billing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { Prescription } from '../../../../core/models/prescription.model';
import { Bill } from '../../../../core/models/billing.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-patient-dashboard',
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h2 class="text-headline-md text-on-surface">Welcome, {{ userName }}</h2>
        <p class="text-body-sm text-outline mt-1">Patient Portal</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl shadow-card p-4 border border-outline-variant">
          <p class="text-label-sm text-outline uppercase">Upcoming Appointments</p>
          <p class="text-headline-md text-on-surface mt-2">{{ appointments.length }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-card p-4 border border-outline-variant">
          <p class="text-label-sm text-outline uppercase">Prescriptions</p>
          <p class="text-headline-md text-on-surface mt-2">{{ prescriptions.length }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-card p-4 border border-outline-variant">
          <p class="text-label-sm text-outline uppercase">Pending Bills</p>
          <p class="text-headline-md text-on-surface mt-2">{{ pendingBills }}</p>
        </div>
        <div class="bg-white rounded-xl shadow-card p-4 border border-outline-variant">
          <p class="text-label-sm text-outline uppercase">Total Bills</p>
          <p class="text-headline-md text-on-surface mt-2">{{ bills.length }}</p>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div class="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 class="text-title-md text-on-surface">Upcoming Appointments</h3>
            <a routerLink="../my-appointments" class="text-sm text-primary hover:underline">View All</a>
          </div>
          @if (appointments.length === 0) {
            <div class="p-6 text-center text-sm text-outline">No upcoming appointments</div>
          } @else {
            @for (apt of appointments.slice(0, 5); track apt.id) {
              <div class="px-4 py-3 border-b border-outline-variant last:border-0 flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-on-surface">{{ apt.appointmentDate | date:'mediumDate' }} at {{ apt.appointmentTime }}</p>
                  <p class="text-xs text-outline">#{{ apt.tokenNumber }} · {{ apt.status }}</p>
                </div>
              </div>
            }
          }
        </div>

        <div class="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div class="px-4 py-3 border-b border-outline-variant flex items-center justify-between">
            <h3 class="text-title-md text-on-surface">Recent Prescriptions</h3>
            <a routerLink="../my-prescriptions" class="text-sm text-primary hover:underline">View All</a>
          </div>
          @if (prescriptions.length === 0) {
            <div class="p-6 text-center text-sm text-outline">No prescriptions</div>
          } @else {
            @for (rx of prescriptions.slice(0, 5); track rx.id) {
              <div class="px-4 py-3 border-b border-outline-variant last:border-0">
                <p class="text-sm font-medium text-on-surface">Rx #{{ rx.id.substring(0, 8) }}</p>
                <p class="text-xs text-outline">{{ rx.createdAt | date:'mediumDate' }} · {{ rx.notes || '—' }}</p>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  imports: [RouterLink, DatePipe],
})
export class PatientDashboard implements OnInit {
  private appointmentService = inject(AppointmentService);
  private prescriptionService = inject(PrescriptionService);
  private billingService = inject(BillingService);
  private authService = inject(AuthService);

  appointments: Appointment[] = [];
  prescriptions: Prescription[] = [];
  bills: Bill[] = [];
  isLoading = false;

  get userName(): string {
    const user = this.authService.currentUserValue;
    return user?.profile?.['firstName'] || user?.email?.split('@')[0] || 'Patient';
  }

  get pendingBills(): number {
    return this.bills.filter((b) => b.paymentStatus === 'UNPAID' || b.paymentStatus === 'PARTIALLY_PAID').length;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    const patientId = this.authService.currentUserValue?.id || '';

    this.appointmentService.getPatientAppointments(patientId).subscribe({
      next: (res) => { if (res.success) { this.appointments = res.data || []; } this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });

    this.prescriptionService.getPatientPrescriptions(patientId).subscribe({
      next: (res) => { if (res.success) { this.prescriptions = res.data || []; } },
    });

    this.billingService.getPatientBills(patientId).subscribe({
      next: (res) => { if (res.success) { this.bills = res.data || []; } },
    });
  }
}
