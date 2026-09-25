import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutStore } from '../../../../core/store/layout.store';
import { AuthService } from '../../../../core/services/auth.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { ReportService } from '../../../../core/services/report.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { DashboardStats } from '../../../../core/models/report.model';

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

  /** Who may list appointments (the API refuses nurses and patients). */
  get seesAppointments(): boolean {
    return ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(this.role);
  }

  /** Clinic totals come from the reports API, which only administrators and doctors may call. */
  get seesTotals(): boolean {
    return ['ADMIN', 'DOCTOR'].includes(this.role);
  }

  get canManage(): boolean {
    return ['ADMIN', 'RECEPTIONIST'].includes(this.role);
  }

  get isDoctor(): boolean {
    return this.role === 'DOCTOR';
  }

  get waiting(): number {
    return this.todays.filter((a) => a.status === 'PENDING').length;
  }

  get maxWeek(): number {
    return Math.max(1, ...this.weekCounts);
  }

  ngOnInit(): void {
    this.layoutStore.setFabConfig({ icon: 'add', label: 'New Appointment', route: 'appointments/book' });
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
    if (this.seesAppointments) {
      pending++;
      const first = this.week[0].day;
      const last = this.week[6].day;
      this.appointmentService.getAppointments(0, 500, undefined, undefined, first, last).subscribe({
        next: (res) => {
          const all = res.success ? res.data.content : [];
          this.weekCounts = this.week.map((w) => all.filter((a) => a.appointmentDate === w.day && !['CANCELLED', 'REJECTED'].includes(a.status)).length);
          const today = localDay(this.today);
          this.todays = all
            .filter((a) => a.appointmentDate === today)
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
