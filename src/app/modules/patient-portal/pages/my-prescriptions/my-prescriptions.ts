import { Component, OnInit, inject } from '@angular/core';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { Prescription } from '../../../../core/models/prescription.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-prescriptions',
  template: `
    <div class="p-4 sm:p-6">
      <h2 class="text-headline-md text-on-surface mb-6">My Prescriptions</h2>
      @if (isLoading) {
        <div class="flex justify-center py-12"><div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div></div>
      } @else if (prescriptions.length === 0) {
        <div class="text-center py-12 text-sm text-outline">No prescriptions found.</div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (rx of prescriptions; track rx.id) {
            <div class="bg-white rounded-xl border border-outline-variant p-4 sm:p-5">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="text-sm font-semibold text-on-surface">Rx #{{ rx.id.substring(0, 8) }}</p>
                  <p class="text-xs text-outline">{{ rx.createdAt | date:'mediumDate' }}</p>
                </div>
                @if (rx.doctor.fullName) {
                  <span class="text-xs bg-primary-container text-primary-on-container px-2.5 py-0.5 rounded-full shrink-0">{{ rx.doctor.fullName }}</span>
                }
              </div>
              @if (rx.notes) {
                <p class="text-sm text-on-surface-variant mb-3"><span class="font-medium">Notes:</span> {{ rx.notes }}</p>
              }
              @if (rx.medicines.length) {
                <div class="border-t border-outline-variant pt-3 mt-2">
                  <p class="text-xs font-semibold text-outline uppercase mb-2">Medicines</p>
                  @for (med of rx.medicines; track med) {
                    <div class="flex items-center justify-between py-1.5 border-b border-outline-variant/50 last:border-0">
                      <span class="text-sm text-on-surface">{{ med.medicineName }}</span>
                      <span class="text-xs text-outline">{{ med.dosage }} · {{ med.frequency }} · {{ med.duration }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  imports: [DatePipe],
})
export class MyPrescriptions implements OnInit {
  private prescriptionService = inject(PrescriptionService);
  prescriptions: Prescription[] = [];
  isLoading = false;
  ngOnInit() {
    this.isLoading = true;
    this.prescriptionService.getPatientPrescriptions().subscribe({
      next: (res) => { if (res.success) { this.prescriptions = res.data || []; } this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }
}
