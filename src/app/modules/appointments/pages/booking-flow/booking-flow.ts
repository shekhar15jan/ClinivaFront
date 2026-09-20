import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../../../core/services/doctor.service';
import { PatientService } from '../../../../core/services/patient.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { DoctorWithSlotsResponse } from '../../../../core/models/doctor.model';
import { Patient } from '../../../../core/models/patient.model';
import { NgClass } from '@angular/common';
import { hospitalCodeFrom } from '../../../../core/utils/route.util';

export interface BookingDate {
  label: string;
  day: string;
  dayName: string;
  fullDate: string;
}

/** The next `count` days starting today, in the clinic's local calendar (not UTC, which can be a day off). */
export function buildDates(today: Date = new Date(), count = 7): BookingDate[] {
  return Array.from({ length: count }, (_v, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      day: pad(d.getDate()),
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    };
  });
}

/** 09:00:00 -> 09:00 */
export const hm = (time: string) => (time ?? '').slice(0, 5);

@Component({
  selector: 'app-booking-flow',
  templateUrl: './booking-flow.html',
  styleUrl: './booking-flow.scss',
  imports: [RouterLink, NgClass, FormsModule, ReactiveFormsModule],
})
export class BookingFlow implements OnInit {
  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  step = 1; // 1: Doctor/Time, 2: Patient, 3: Confirm
  isLoading = false;
  isSubmitting = false;
  isReschedule = false;
  rescheduleFromId: string | null = null;

  doctors: DoctorWithSlotsResponse[] = [];
  patients: Patient[] = [];
  selectedDate: string;

  bookingForm: FormGroup;
  patientForm: FormGroup;

  // The week ahead, starting today. These were three hard-coded dates in October 2023.
  dates: BookingDate[] = buildDates();

  constructor() {
    this.selectedDate = this.dates[0].fullDate;

    this.bookingForm = this.fb.group({
      doctorId: ['', Validators.required],
      appointmentDate: [this.selectedDate, Validators.required],
      appointmentTime: ['', Validators.required],
    });

    this.patientForm = this.fb.group({
      patientMode: ['existing'], // existing or new
      patientId: [''],
      // New patient fields
      fullName: [''],
      dateOfBirth: [''],
      gender: ['MALE'],
      phone: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['rescheduleFrom']) {
        this.isReschedule = true;
        this.rescheduleFromId = params['rescheduleFrom'];
        this.toastService.info('Rescheduling appointment - please select new date/time');
        
        if (params['doctorId']) {
          this.bookingForm.patchValue({ doctorId: params['doctorId'] });
        }
        if (params['patientId']) {
          this.patientForm.patchValue({ patientId: params['patientId'] });
        }
      }
    });
    
    this.loadDoctors();
    this.loadPatients();
  }

  loadDoctors() {
    this.isLoading = true;
    this.doctorService.getDoctorsWithSlots(this.selectedDate).subscribe((res) => {
      if (res.success) {
        this.doctors = res.data;
      }
      this.isLoading = false;
    });
  }

  loadPatients() {
    this.patientService.getPatients(0, 100).subscribe((res) => {
      if (res.success) {
        this.patients = res.data.content;
      }
    });
  }

  hm = hm;

  get selectedDoctorLabel(): string {
    const doc = this.doctors.find((d) => d.doctor.id === this.bookingForm.get('doctorId')?.value)?.doctor;
    return doc ? `${doc.fullName} (${doc.specialization})` : '';
  }

  get selectedPatientLabel(): string {
    if (this.patientForm.get('patientMode')?.value === 'new') {
      return `New patient: ${this.patientForm.get('fullName')?.value} (${this.patientForm.get('phone')?.value})`;
    }
    const p = this.patients.find((x) => x.id === this.patientForm.get('patientId')?.value);
    return p ? `${p.fullName} (${p.phone})` : '';
  }

  get selectedDoctorSlots(): string[] {
    const docId = this.bookingForm.get('doctorId')?.value;
    const doc = this.doctors.find((d) => d.doctor.id === docId);
    return doc ? doc.availability.map((a) => a.startTime) : [];
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  selectDoctor(id: string) {
    this.bookingForm.patchValue({ doctorId: id, appointmentTime: '' });
  }

  selectDate(fullDate: string) {
    this.selectedDate = fullDate;
    this.bookingForm.patchValue({ appointmentDate: fullDate, appointmentTime: '' });
    this.loadDoctors();
  }

  selectTime(time: string) {
    this.bookingForm.patchValue({ appointmentTime: time });
  }

  nextStep() {
    if (this.step === 1 && this.bookingForm.valid) {
      this.step = 2;
    } else if (this.step === 2) {
      // Basic validation
      const mode = this.patientForm.get('patientMode')?.value;
      if (mode === 'existing' && !this.patientForm.get('patientId')?.value) return;
      if (
        mode === 'new' &&
        (!this.patientForm.get('fullName')?.value || !this.patientForm.get('phone')?.value)
      )
        return;

      this.step = 3;
    }
  }

  prevStep() {
    if (this.step > 1) this.step--;
  }

  confirmBooking() {
    if (this.isSubmitting) return;
    const patientData = this.patientForm.value;
    if (patientData.patientMode !== 'new' && !patientData.patientId) {
      this.toastService.error('Choose a patient first.');
      return;
    }
    this.isSubmitting = true;

    if (patientData.patientMode === 'new') {
      // Register the patient first. This used to skip that and book the first patient in the list
      // (or a made-up id when there were none), so the appointment belonged to someone else.
      this.patientService
        .createPatient({ fullName: patientData.fullName, phone: patientData.phone, gender: patientData.gender })
        .subscribe({
          next: (res) => {
            if (res.success && res.data?.id) {
              this.book(res.data.id);
            } else {
              this.failBooking(res.message || 'The new patient could not be registered.');
            }
          },
          error: (err) => this.failBooking(err?.error?.message || 'The new patient could not be registered.'),
        });
      return;
    }
    this.book(patientData.patientId);
  }

  private book(patientId: string) {
    const bookingData = this.bookingForm.value;
    this.appointmentService
      .createAppointment({
        patientId,
        doctorId: bookingData.doctorId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        reason: this.isReschedule ? 'Rescheduled appointment' : 'Checkup',
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toastService.success(this.isReschedule ? 'Appointment rescheduled successfully' : 'Appointment booked successfully');
          this.router.navigate(['/', hospitalCodeFrom(this.route), 'appointments']);
        },
        error: (err) => this.failBooking(err?.error?.message || 'Failed to book appointment'),
      });
  }

  private failBooking(message: string) {
    this.isSubmitting = false;
    this.toastService.error(message);
  }
}
