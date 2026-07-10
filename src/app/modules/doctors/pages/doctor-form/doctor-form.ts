import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DoctorService } from '../../../../core/services/doctor.service';

@Component({
  selector: 'app-doctor-form',
  template: `
    <div class="p-6">
      <div class="flex items-center gap-2 mb-6 text-sm">
        <a routerLink="../" class="text-[#64748B] hover:text-[#0052CC]">Doctors</a>
        <span class="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
        <span class="text-[#1E293B] font-medium">Register New Doctor</span>
      </div>

      <div class="max-w-2xl bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-bold text-[#1E293B] mb-6">Doctor Registration</h2>

        <form [formGroup]="doctorForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="fullName" class="block text-sm font-medium text-[#475569] mb-1">Full Name</label>
              <input
                id="fullName"
                type="text"
                formControlName="fullName"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <label for="specialization" class="block text-sm font-medium text-[#475569] mb-1">Specialization</label>
              <select
                formControlName="specialization"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              >
                <option value="">Select</option>
                <option>Cardiologist</option>
                <option>General Physician</option>
                <option>Dermatologist</option>
                <option>Pediatrician</option>
                <option>Neurologist</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="qualification" class="block text-sm font-medium text-[#475569] mb-1">Qualification</label>
              <input
                id="qualification"
                type="text"
                formControlName="qualification"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                placeholder="MBBS, MD"
              />
            </div>
            <div>
              <label for="experienceYears" class="block text-sm font-medium text-[#475569] mb-1"
                >Experience (Years)</label
              >
              <input
                id="experienceYears"
                type="number"
                formControlName="experienceYears"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                placeholder="5"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="phone" class="block text-sm font-medium text-[#475569] mb-1">Phone</label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                placeholder="9876543210"
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-medium text-[#475569] mb-1">Email</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                placeholder="doctor@cliniva.com"
              />
            </div>
          </div>

          <div>
            <label for="consultationFee" class="block text-sm font-medium text-[#475569] mb-1"
              >Consultation Fee (₹)</label
            >
            <input
              id="consultationFee"
              type="number"
              formControlName="consultationFee"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
              placeholder="500"
            />
          </div>

          @if (error) {
            <div class="text-sm text-status-red bg-status-red/5 p-3 rounded-lg">
              {{ error }}
            </div>
          }

          <div class="flex items-center gap-3 pt-4">
            <button
              type="submit"
              [disabled]="doctorForm.invalid || isSubmitting"
              class="bg-[#0052CC] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50"
            >
              {{ isSubmitting ? 'Saving...' : 'Save Doctor' }}
            </button>
            <a
              routerLink="../"
              class="text-[#64748B] hover:text-[#1E293B] text-sm font-medium px-4 py-2"
              >Cancel</a
            >
          </div>
        </form>
      </div>
    </div>
  `,
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
})
export class DoctorForm {
  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);
  private router = inject(Router);

  doctorForm: FormGroup;
  isSubmitting = false;
  error = '';

  constructor() {
    this.doctorForm = this.fb.group({
      fullName: ['', Validators.required],
      specialization: ['', Validators.required],
      qualification: ['', Validators.required],
      experienceYears: [0],
      phone: ['', Validators.pattern('^[0-9]{10}$')],
      email: ['', Validators.email],
      consultationFee: [0, [Validators.required, Validators.min(1)]],
    });
  }

  onSubmit() {
    if (this.doctorForm.invalid) return;

    this.isSubmitting = true;
    this.error = '';
    const formVal = this.doctorForm.value;

    const doctorData = {
      fullName: formVal.fullName,
      specialization: formVal.specialization,
      qualification: formVal.qualification,
      experienceYears: formVal.experienceYears,
      phone: formVal.phone,
      email: formVal.email,
      consultationFeeInPaisa: (formVal.consultationFee || 0) * 100,
      isActive: true,
    };

    this.doctorService.createDoctor(doctorData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['../'], { relativeTo: this.router.routerState.root });
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSubmitting = false;
        this.error = err.error?.message || 'Failed to save doctor';
      },
    });
  }
}
