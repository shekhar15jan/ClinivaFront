import { Component, OnInit } from '@angular/core';
import { Prescription } from '../../../../core/models/prescription.model';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-prescription-list',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Prescriptions</h1>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <div class="relative w-full max-w-sm">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              >search</span
            >
            <input
              type="text"
              placeholder="Search by patient name or ID..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC] text-left">
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">#</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Patient</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Doctor</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Medicines</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Date</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (rx of prescriptions; track rx) {
              <tr class="border-t border-gray-100 hover:bg-[#F8FAFC]">
                <td class="px-4 py-3 text-sm font-mono text-[#64748B]">
                  {{ rx.id.substring(0, 8) }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">{{ rx.patientName }}</td>
                <td class="px-4 py-3 text-sm text-[#475569]">{{ rx.doctorName }}</td>
                <td class="px-4 py-3 text-sm text-[#64748B]">{{ rx.medicines.length }} items</td>
                <td class="px-4 py-3 text-sm text-[#64748B]">
                  {{ rx.createdAt | date: 'mediumDate' }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <button
                      [routerLink]="['/prescriptions', rx.id]"
                      class="text-[#64748B] hover:text-[#0052CC] p-1 rounded"
                      title="View"
                    >
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button
                      class="text-[#64748B] hover:text-[#0052CC] p-1 rounded"
                      title="Download PDF"
                    >
                      <span class="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  imports: [RouterLink, DatePipe],
})
export class PrescriptionList implements OnInit {
  prescriptions: Prescription[] = [];

  ngOnInit() {
    this.prescriptions = [
      {
        id: 'rx-001',
        consultationId: 'c1',
        patientId: '1',
        patientName: 'Rahul Sharma',
        doctorId: 'd1',
        doctorName: 'Dr. Anita Desai',
        medicines: [
          {
            medicineName: 'Paracetamol 500mg',
            dosage: '1 tablet',
            frequency: '3 times daily',
            duration: '5 days',
          },
        ],
        createdAt: '2026-06-25T10:30:00',
      },
      {
        id: 'rx-002',
        consultationId: 'c2',
        patientId: '2',
        patientName: 'Priya Patel',
        doctorId: 'd2',
        doctorName: 'Dr. Vivek Kumar',
        medicines: [
          {
            medicineName: 'Amoxicillin 250mg',
            dosage: '1 capsule',
            frequency: '2 times daily',
            duration: '7 days',
          },
          {
            medicineName: 'Cetirizine 10mg',
            dosage: '1 tablet',
            frequency: 'Once daily',
            duration: '5 days',
          },
        ],
        createdAt: '2026-07-01T14:00:00',
      },
    ];
  }
}
