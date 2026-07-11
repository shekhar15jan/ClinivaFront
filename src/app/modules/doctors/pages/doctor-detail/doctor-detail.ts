import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DoctorService } from '../../../../core/services/doctor.service';
import { Doctor } from '../../../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-detail',
  template: `
    <div class="p-6">
      <div class="flex items-center gap-2 mb-6 text-sm">
        <a routerLink="../" class="text-[#64748B] hover:text-[#0052CC]">Doctors</a>
        <span class="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
        <span class="text-[#1E293B] font-medium">{{ doctor?.fullName }}</span>
      </div>

      @if (isLoading) {
        <div class="text-center py-8 text-sm text-[#64748B]">Loading doctor details...</div>
      }

      @if (!isLoading && doctor) {
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div class="flex flex-col sm:flex-row items-start gap-4">
            <div
              class="w-16 h-16 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#0052CC] text-2xl font-bold"
            >
              {{ doctor.fullName.charAt(0) }}
            </div>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-[#1E293B]">{{ doctor.fullName }}</h1>
              <p class="text-sm text-[#64748B]">
                {{ doctor.specialization }} &bull; {{ doctor.qualification }}
              </p>
              <div class="flex gap-4 mt-3">
                <div class="flex items-center gap-1 text-sm text-[#64748B]">
                  <span class="material-symbols-outlined text-base">call</span> {{ doctor.phone }}
                </div>
                <div class="flex items-center gap-1 text-sm text-[#64748B]">
                  <span class="material-symbols-outlined text-base">mail</span> {{ doctor.email }}
                </div>
              </div>
            </div>
            <span
              [class]="
                doctor.isActive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
              "
              class="px-3 py-1 rounded-full text-xs font-medium"
            >
              {{ doctor.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      }

      @if (!isLoading && doctor) {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-3">Consultation Fee</h3>
            <p class="text-2xl font-bold text-[#0052CC]">
              ₹{{ (doctor.consultationFeeInPaisa || 0) / 100 }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-3">Today's Appointments</h3>
            <p class="text-2xl font-bold text-[#1E293B]">{{ todayAppointments }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-3">Experience</h3>
            <p class="text-2xl font-bold text-[#1E293B]">{{ experience }} years</p>
          </div>
        </div>
      }

      @if (!isLoading && doctor) {
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-[#1E293B] mb-4">Weekly Schedule</h3>
          <div class="space-y-2">
            @for (day of weekDays; track day) {
              <div
                class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[#F8FAFC]"
              >
                <span class="text-sm font-medium text-[#475569] w-28">{{ day.name }}</span>
                <span class="text-sm text-[#64748B]">{{ day.slots }}</span>
                <span class="material-symbols-outlined text-base text-[#94A3B8]">schedule</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  imports: [RouterLink],
})
export class DoctorDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private doctorService = inject(DoctorService);

  doctor: Doctor | undefined;
  isLoading = false;
  todayAppointments = 8;
  experience = 12;

  weekDays = [
    { name: 'Monday', slots: '09:00 AM - 05:00 PM' },
    { name: 'Tuesday', slots: '09:00 AM - 05:00 PM' },
    { name: 'Wednesday', slots: '09:00 AM - 01:00 PM' },
    { name: 'Thursday', slots: '09:00 AM - 05:00 PM' },
    { name: 'Friday', slots: '09:00 AM - 03:00 PM' },
    { name: 'Saturday', slots: 'Not Available' },
    { name: 'Sunday', slots: 'Not Available' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isLoading = true;
      this.doctorService.getDoctorById(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.doctor = res.data;
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    }
  }
}
