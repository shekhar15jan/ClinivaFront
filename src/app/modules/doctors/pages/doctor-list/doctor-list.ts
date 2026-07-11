import { Component, OnInit, inject } from '@angular/core';
import { DoctorService } from '../../../../core/services/doctor.service';
import { Doctor } from '../../../../core/models/doctor.model';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-doctor-list',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Doctors</h1>
        <button
          [routerLink]="['new']"
          class="bg-[#0052CC] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b] flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-lg">add</span> Add Doctor
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              >search</span
            >
            <input
              type="text"
              placeholder="Search doctors..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </div>
          <select
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Specializations</option>
            <option>Cardiologist</option>
            <option>General Physician</option>
            <option>Dermatologist</option>
            <option>Pediatrician</option>
          </select>
        </div>

        <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC] text-left">
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Doctor</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">
                Specialization
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">
                Qualification
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Fee</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading) {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-sm text-[#64748B]">
                  Loading doctors...
                </td>
              </tr>
            }
            @for (doc of doctors; track doc) {
              <tr class="border-t border-gray-100 hover:bg-[#F8FAFC]">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#0052CC] font-semibold text-sm"
                    >
                      {{ doc.fullName.charAt(0) }}
                    </div>
                    <div>
                      <p class="text-sm font-medium text-[#1E293B]">{{ doc.fullName }}</p>
                      <p class="text-xs text-[#64748B]">{{ doc.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-[#475569]">{{ doc.specialization }}</td>
                <td class="px-4 py-3 text-sm text-[#475569]">{{ doc.qualification }}</td>
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">
                  ₹{{ doc.consultationFeeInPaisa / 100 }}
                </td>
                <td class="px-4 py-3">
                  <span
                    [class]="
                      doc.isActive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
                    "
                    class="px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    {{ doc.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <button
                      [routerLink]="[doc.id]"
                      class="text-[#64748B] hover:text-[#0052CC] p-1 rounded"
                    >
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        </div>

        <div class="md:hidden divide-y divide-outline-variant">
          @if (isLoading) {
            <div class="px-4 py-8 text-center text-body-sm text-on-surface-variant">Loading doctors...</div>
          }
          @for (doc of doctors; track doc) {
            <div class="px-4 py-3.5 flex flex-col gap-3 bg-surface">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-semibold text-sm shrink-0"
                >
                  {{ doc.fullName.charAt(0) }}
                </div>
                <div class="min-w-0">
                  <span class="text-title-md font-semibold text-on-surface block truncate">{{ doc.fullName }}</span>
                  <span class="text-body-sm text-on-surface-variant block truncate">{{ doc.email }}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 text-body-sm text-on-surface-variant">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-base">stethoscope</span>
                  {{ doc.specialization }}
                </span>
                <span class="text-on-surface-variant">|</span>
                <span>{{ doc.qualification }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-title-md font-semibold text-on-surface">₹{{ doc.consultationFeeInPaisa / 100 }}</span>
                <span
                  [class]="
                    doc.isActive ? 'bg-status-green-light text-status-green' : 'bg-status-red-light text-status-red'
                  "
                  class="px-2.5 py-1 rounded-full text-label-sm font-medium"
                >
                  {{ doc.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="flex items-center gap-2 pt-1">
                <button
                  [routerLink]="[doc.id]"
                  class="flex items-center gap-1 px-3 py-1.5 text-label-sm font-medium text-white bg-primary rounded-lg"
                >
                  <span class="material-symbols-outlined text-sm">visibility</span> View
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  imports: [RouterLink, FormsModule],
})
export class DoctorList implements OnInit {
  private doctorService = inject(DoctorService);

  doctors: Doctor[] = [];
  isLoading = false;

  ngOnInit() {
    this.isLoading = true;
    this.doctorService.getDoctors().subscribe({
      next: (res) => {
        if (res.success) {
          this.doctors = res.data;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }
}
