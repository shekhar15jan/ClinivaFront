import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Prescription } from '../../../../core/models/prescription.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-prescription-detail',
  template: `
    <div class="p-6">
      <div class="flex items-center gap-2 mb-6 text-sm">
        <a routerLink="/prescriptions" class="text-[#64748B] hover:text-[#0052CC]">Prescriptions</a>
        <span class="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
        <span class="text-[#1E293B] font-medium">Rx #{{ prescription?.id?.substring(0, 8) }}</span>
      </div>

      @if (prescription) {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden" id="print-section">
          <div class="border-b border-gray-200 p-6 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-[#1E293B]">Cliniva Hospital</h2>
              <p class="text-sm text-[#64748B]">123 Healthcare Avenue, Medical District</p>
              <p class="text-sm text-[#64748B]">prescriptions@cliniva.com | +91 9876543210</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-[#1E293B]">Prescription #{{ prescription.id }}</p>
              <p class="text-xs text-[#64748B]">
                Date: {{ prescription.createdAt | date: 'mediumDate' }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 p-6 border-b border-gray-100">
            <div>
              <p class="text-xs font-semibold text-[#64748B] uppercase mb-1">Patient</p>
              <p class="text-sm font-medium text-[#1E293B]">{{ prescription.patientName }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-[#64748B] uppercase mb-1">Doctor</p>
              <p class="text-sm font-medium text-[#1E293B]">{{ prescription.doctorName }}</p>
            </div>
          </div>
          <div class="p-6">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-4">Prescribed Medicines</h3>
            <table class="w-full">
              <thead>
                <tr class="bg-[#F8FAFC] text-left">
                  <th class="px-3 py-2 text-xs font-semibold text-[#64748B]">Medicine</th>
                  <th class="px-3 py-2 text-xs font-semibold text-[#64748B]">Dosage</th>
                  <th class="px-3 py-2 text-xs font-semibold text-[#64748B]">Frequency</th>
                  <th class="px-3 py-2 text-xs font-semibold text-[#64748B]">Duration</th>
                  <th class="px-3 py-2 text-xs font-semibold text-[#64748B]">Instructions</th>
                </tr>
              </thead>
              <tbody>
                @for (med of prescription.medicines; track med) {
                  <tr class="border-t border-gray-100">
                    <td class="px-3 py-2 text-sm font-medium text-[#1E293B]">
                      {{ med.medicineName }}
                    </td>
                    <td class="px-3 py-2 text-sm text-[#475569]">{{ med.dosage }}</td>
                    <td class="px-3 py-2 text-sm text-[#475569]">{{ med.frequency }}</td>
                    <td class="px-3 py-2 text-sm text-[#475569]">{{ med.duration }}</td>
                    <td class="px-3 py-2 text-sm text-[#64748B]">{{ med.instructions || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
            @if (prescription.notes) {
              <div class="mt-4 p-3 bg-[#F8FAFC] rounded-lg">
                <p class="text-xs font-semibold text-[#64748B] uppercase mb-1">Additional Notes</p>
                <p class="text-sm text-[#475569]">{{ prescription.notes }}</p>
              </div>
            }
          </div>
          <div class="border-t border-gray-200 p-4 flex justify-end gap-3">
            <button
              onclick="window.print()"
              class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]"
            >
              <span class="material-symbols-outlined text-lg">print</span> Print
            </button>
            <button
              class="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d9b]"
            >
              <span class="material-symbols-outlined text-lg">download</span> Download PDF
            </button>
          </div>
        </div>
      }
    </div>
  `,
  imports: [RouterLink, DatePipe],
})
export class PrescriptionDetail implements OnInit {
  private route = inject(ActivatedRoute);

  prescription: Prescription | undefined;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const all: Prescription[] = [
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
    this.prescription = all.find((p) => p.id === id);
  }
}
