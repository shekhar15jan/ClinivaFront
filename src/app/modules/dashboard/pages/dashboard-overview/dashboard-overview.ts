import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutStore } from '../../../../core/store/layout.store';
import { AuthService } from '../../../../core/services/auth.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { ReportService } from '../../../../core/services/report.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { DashboardStats, MyPerformance } from '../../../../core/models/report.model';

/** A local calendar day as YYYY-MM-DD (toISOString would give the UTC day, which can be off by one). */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The Monday-to-Sunday days of the week containing `today`. */
export function weekDays(today: Date): { day: string; label: string }[] {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_v, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return { day: localDay(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }) };
  });
}

export function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The clinic's home screen, built from what is really happening: today's appointments and the week's
 * activity for whoever may list appointments, and clinic totals for administrators and doctors (the only
 * roles the reports API answers). It used to be a fixed picture: "42 appointments", "1,284 patients",
 * "€45k" and three made-up patients.
 */
@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.scss',
  // Without this the routerLink attributes in the template are inert and the quick actions do nothing.
  imports: [RouterLink],
})
export class DashboardOverview implements OnInit, OnDestroy {
  private layoutStore = inject(LayoutStore);
  private auth = inject(AuthService);
  private appointmentService = inject(AppointmentService);
  private reportService = inject(ReportService);

  readonly today = new Date();
  readonly week = weekDays(this.today);

  stats: DashboardStats | null = null;
  /** A doctor's own numbers (their visits and what they were billed), instead of the clinic's money. */
  mine: MyPerformance | null = null;
  todays: Appointment[] = [];
  weekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  isLoading = true;
  error = '';

  get role(): string {
    return this.auth.currentUserValue?.role ?? '';
  }

  get name(): string {
    const profile = this.auth.currentUserValue?.profile;
    return `${profile?.['firstName'] ?? ''} ${profile?.['lastName'] ?? ''}`.trim() || this.auth.currentUserValue?.email || '';
  }

  get greeting(): string {
    return greetingFor(this.today.getHours());
  }

  /** Who may list appointments (APPOINTMENT_VIEW). */
  get seesAppointments(): boolean {
    return this.auth.can('APPOINTMENT_VIEW');
  }

  /** Clinic counts are for all staff; the money in them (unpaid bills) only comes back with finance reports. */
  get seesTotals(): boolean {
    return !!this.auth.currentUserValue && this.role !== 'PATIENT';
  }

  get canManage(): boolean {
    return this.auth.can('APPOINTMENT_MANAGE');
  }

  get isDoctor(): boolean {
    return this.role === 'DOCTOR';
  }

  /** Paisa as rupees, Indian grouping (1,25,000). */
  rupees(paisa: number): string {
    return (paisa / 100).toLocaleString('en-IN');
  }

  get waiting(): number {
    return this.todays.filter((a) => a.status === 'PENDING').length;
  }

  get maxWeek(): number {
    return Math.max(1, ...this.weekCounts);
  }

  ngOnInit(): void {
    // The phone's "New Appointment" button only for those who book.
    if (this.canManage) {
      this.layoutStore.setFabConfig({ icon: 'add', label: 'New Appointment', route: 'appointments/book' });
    }
    this.load();
  }

  ngOnDestroy(): void {
    this.layoutStore.setFabConfig(null);
  }

  load(): void {
    this.isLoading = true;
    this.error = '';
    let pending = 0;
    const done = () => {
      if (--pending === 0) this.isLoading = false;
    };

    if (this.seesTotals) {
      pending++;
      this.reportService.getDashboardStats().subscribe({
        next: (res) => {
          this.stats = res.success ? res.data : null;
          done();
        },
        error: (err) => {
          this.error = err?.error?.message || 'The clinic totals could not be loaded.';
          done();
        },
      });
    }
    if (this.isDoctor) {
      this.reportService.getMyPerformance().subscribe({
        next: (res) => (this.mine = res.success ? res.data : null),
        error: () => (this.mine = null),
      });
    }
    if (this.seesAppointments) {
      pending++;
      const first = this.week[0].day;
      const last = this.week[6].day;
      // The week's counts come from the server: counting a list capped at 500 undercounted a busy week.
      pending++;
      this.appointmentService.getCountsByDay(first, last).subscribe({
        next: (res) => {
          const counts = res.success ? res.data ?? {} : {};
          this.weekCounts = this.week.map((w) => counts[w.day] ?? 0);
          done();
        },
        error: () => done(),
      });
      const today = localDay(this.today);
      this.appointmentService.getAppointments(0, 500, undefined, undefined, today, today).subscribe({
        next: (res) => {
          this.todays = (res.success ? res.data.content : [])
            .sort((a, b) => (a.appointmentTime ?? '').localeCompare(b.appointmentTime ?? ''));
          done();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Today\'s appointments could not be loaded.';
          done();
        },
      });
    }
    if (pending === 0) this.isLoading = false;
  }

  time(appointment: Appointment): string {
    return (appointment.appointmentTime ?? '').slice(0, 5);
  }

  barHeight(count: number): number {
    return Math.round((count / this.maxWeek) * 100);
  }

  isToday(day: string): boolean {
    return day === localDay(this.today);
  }
}
