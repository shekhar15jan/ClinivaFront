import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { DoctorService } from '../../../../core/services/doctor.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { Doctor } from '../../../../core/models/doctor.model';

@Component({
  selector: 'app-appointment-calendar',
  templateUrl: './appointment-calendar.html',
  styleUrl: './appointment-calendar.scss',
  imports: [RouterLink],
})
export class AppointmentCalendar implements OnInit {
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  currentDate = new Date();
  doctors: Doctor[] = [];
  appointments: Appointment[] = [];
  isLoading = true;

  // For simplicity, defining static time blocks for the mock UI
  timeBlocks = [
    { time: '09:00 AM', top: 0 },
    { time: '10:00 AM', top: 64 },
    { time: '11:00 AM', top: 128 },
    { time: '12:00 PM', top: 192 },
    { time: '01:00 PM', top: 256 },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    // Fetch doctors
    this.doctorService.getDoctors().subscribe((dRes) => {
      if (dRes.success) {
        this.doctors = dRes.data.content;
      }

      // Fetch appointments
      this.appointmentService.getAppointments().subscribe((aRes) => {
        if (aRes.success) {
          this.appointments = aRes.data.content;
        }
        this.isLoading = false;
      });
    });
  }

  getAppointmentsForDoctor(doctorId: string): Appointment[] {
    return this.appointments.filter((a) => a.doctor?.id === doctorId);
  }

  getTopPosition(time: string): number {
    // Simple mock calculation based on HH:mm string
    const match = time.match(/(\d+):(\d+) (AM|PM)/);
    if (!match) return 0;
    let hour = parseInt(match[1]);
    const min = parseInt(match[2]);
    const ampm = match[3];

    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    // Assuming timeline starts at 9:00 AM which is top: 0, and each hour is 64px
    const startHour = 9;
    const hoursDiff = hour - startHour;
    return hoursDiff * 64 + (min / 60) * 64;
  }

  rescheduleAppointment(appointment: Appointment): void {
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.toastService.success('Appointment cancelled. Redirecting to book a new one...');
        this.router.navigate(['book'], {
          queryParams: {
            doctorId: appointment.doctor?.id,
            patientId: appointment.patient?.id,
            rescheduleFrom: appointment.id,
          }
        });
      },
      error: () => {
        this.toastService.error('Failed to cancel appointment for reschedule');
      }
    });
  }

  cancelAppointment(appointment: Appointment): void {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    this.appointmentService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.toastService.success('Appointment cancelled');
        this.loadData();
      },
      error: () => {
        this.toastService.error('Failed to cancel appointment');
      }
    });
  }
}
