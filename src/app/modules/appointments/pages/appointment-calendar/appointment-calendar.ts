import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Appointment } from '../../../../core/models/appointment.model';
import { hospitalCodeFrom } from '../../../../core/utils/route.util';

/** A local calendar day as YYYY-MM-DD (toISOString would give the UTC day, which can be yesterday or tomorrow). */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The day `offset` days from `day` (YYYY-MM-DD), across month and year ends. */
export function shiftDay(day: string, offset: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y, m - 1, d + offset));
}

/** 10:00:00 -> 10:00 */
export const hm = (time: string): string => (time ?? '').slice(0, 5);

@Component({
  selector: 'app-appointment-calendar',
  templateUrl: './appointment-calendar.html',
  styleUrl: './appointment-calendar.scss',
  imports: [RouterLink, ConfirmDialogComponent],
})
export class AppointmentCalendar implements OnInit {
  private appointmentService = inject(AppointmentService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  selectedDay = localDay(new Date());
  appointments: Appointment[] = [];
  isLoading = true;
  loadError = '';
  toCancel: Appointment | null = null;
  busyId: string | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  get isToday(): boolean {
    return this.selectedDay === localDay(new Date());
  }

  get dayLabel(): string {
    const [y, m, d] = this.selectedDay.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  /** Front desk manages bookings; a doctor only sees theirs and starts the consultation. */
  get canManage(): boolean {
    const role = this.auth.currentUserValue?.role;
    return role === 'ADMIN' || role === 'RECEPTIONIST';
  }

  get isDoctor(): boolean {
    return this.auth.currentUserValue?.role === 'DOCTOR';
  }

  get pendingCount(): number {
    return this.appointments.filter((a) => a.status === 'PENDING').length;
  }

  loadData(): void {
    this.isLoading = true;
    this.loadError = '';
    this.appointmentService.getAppointments(0, 200, undefined, undefined, this.selectedDay, this.selectedDay).subscribe({
      next: (res) => {
        this.appointments = res.success
          ? [...res.data.content].sort((a, b) => (a.appointmentTime ?? '').localeCompare(b.appointmentTime ?? ''))
          : [];
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'The appointments could not be loaded.';
      },
    });
  }

  goTo(day: string): void {
    if (!day || day === this.selectedDay) return;
    this.selectedDay = day;
    this.loadData();
  }

  previousDay(): void {
    this.goTo(shiftDay(this.selectedDay, -1));
  }

  nextDay(): void {
    this.goTo(shiftDay(this.selectedDay, 1));
  }

  today(): void {
    this.goTo(localDay(new Date()));
  }

  time(appointment: Appointment): string {
    return hm(appointment.appointmentTime);
  }

  approve(appointment: Appointment): void {
    this.act(appointment, this.appointmentService.approveAppointment(appointment.id), 'Appointment approved', 'The appointment could not be approved.');
  }

  reject(appointment: Appointment): void {
    this.act(appointment, this.appointmentService.rejectAppointment(appointment.id), 'Appointment rejected', 'The appointment could not be rejected.');
  }

  askCancel(appointment: Appointment): void {
    this.toCancel = appointment;
  }

  cancel(): void {
    const appointment = this.toCancel;
    this.toCancel = null;
    if (!appointment) return;
    this.act(appointment, this.appointmentService.cancelAppointment(appointment.id), 'Appointment cancelled', 'The appointment could not be cancelled.');
  }

  /** Frees the slot, then opens the booking screen with the doctor and patient already chosen. */
  reschedule(appointment: Appointment): void {
    this.busyId = appointment.id;
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.busyId = null;
        this.toastService.success('Pick a new time for this patient');
        this.router.navigate(['/', hospitalCodeFrom(this.route), 'appointments', 'book'], {
          queryParams: {
            doctorId: appointment.doctor?.id,
            patientId: appointment.patient?.id,
            rescheduleFrom: appointment.id,
          },
        });
      },
      error: (err) => {
        this.busyId = null;
        this.toastService.error(err?.error?.message || 'The appointment could not be rescheduled.');
      },
    });
  }

  private act(appointment: Appointment, request: ReturnType<AppointmentService['approveAppointment']>, done: string, failed: string): void {
    this.busyId = appointment.id;
    request.subscribe({
      next: () => {
        this.busyId = null;
        this.toastService.success(done);
        this.loadData();
      },
      error: (err) => {
        this.busyId = null;
        this.toastService.error(err?.error?.message || failed);
      },
    });
  }
}
