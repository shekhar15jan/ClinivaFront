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

  // Mock dates for UI
  dates = [
    { label: 'Oct', day: '24', dayName: 'Tue', fullDate: '2023-10-24' },
    { label: 'Oct', day: '25', dayName: 'Wed', fullDate: '2023-10-25' },
    { label: 'Oct', day: '26', dayName: 'Thu', fullDate: '2023-10-26' },
  ];

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
    this.isSubmitting = true;
    const bookingData = this.bookingForm.value;
    const patientData = this.patientForm.value;

    // In a real app we might create the patient first if mode === 'new'
    // For mock, we'll assume we use existing patient

    this.appointmentService
      .createAppointment({
        patientId: patientData.patientId || (this.patients.length > 0 ? this.patients[0].id : '1'),
        doctorId: bookingData.doctorId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        reason: this.isReschedule ? 'Rescheduled appointment' : 'Checkup',
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          if (this.isReschedule) {
            this.toastService.success('Appointment rescheduled successfully');
          } else {
            this.toastService.success('Appointment booked successfully');
          }
          this.router.navigate(['/appointments']);
        },
        error: () => {
          this.isSubmitting = false;
          this.toastService.error('Failed to book appointment');
        },
      });
  }
}
