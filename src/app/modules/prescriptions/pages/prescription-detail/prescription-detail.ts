import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { BillingService } from '../../../../core/services/billing.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { hospitalCodeFrom } from '../../../../core/utils/route.util';
import { Prescription } from '../../../../core/models/prescription.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-prescription-detail',
  template: `
    <div class="p-6">
      <div class="flex items-center gap-2 mb-6 text-sm">
        <a routerLink=".." class="text-[#64748B] hover:text-[#0052CC]">Prescriptions</a>
        <span class="material-symbols-outlined text-sm text-[#94A3B8]">chevron_right</span>
        <span class="text-[#1E293B] font-medium">Rx #{{ id?.substring(0, 8) }}</span>
      </div>

      @if (isLoading) {
        <div class="flex justify-center py-12">
          <div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div>
        </div>
      }

      @if (error) {
        <div class="text-center py-12 text-red-600">{{ error }}</div>
      }

      @if (prescription && !isLoading) {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden" id="print-section">
          <div class="border-b border-gray-200 p-6 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-bold text-[#1E293B]">Cliniva Hospital</h2>
              <p class="text-sm text-[#64748B]">123 Healthcare Avenue, Medical District</p>
              <p class="text-sm text-[#64748B]">prescriptions@cliniva.com</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-[#1E293B]">Prescription #{{ prescription.id }}</p>
              <p class="text-xs text-[#64748B]">
                Date: {{ prescription.createdAt | date: 'mediumDate' }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 border-b border-gray-100">
            <div>
              <p class="text-xs font-semibold text-[#64748B] uppercase mb-1">Patient</p>
              <p class="text-sm font-medium text-[#1E293B]">{{ prescription.patient.fullName }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-[#64748B] uppercase mb-1">Doctor</p>
              <p class="text-sm font-medium text-[#1E293B]">{{ prescription.doctor.fullName }}</p>
            </div>
          </div>
          <div class="p-6">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-4">Prescribed Medicines</h3>
            <div class="overflow-x-auto">
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
            </div>
            @if (prescription.notes) {
              <div class="mt-4 p-3 bg-[#F8FAFC] rounded-lg">
                <p class="text-xs font-semibold text-[#64748B] uppercase mb-1">Additional Notes</p>
                <p class="text-sm text-[#475569]">{{ prescription.notes }}</p>
              </div>
            }
          </div>
          @if (canGenerateBill) {
            <div class="border-t border-gray-200 p-6 bg-[#F8FAFC]" id="generate-bill">
              <h3 class="text-sm font-semibold text-[#1E293B] mb-1">Bill for this visit</h3>
              <p class="text-xs text-[#64748B] mb-4">
                The bill is the doctor's consultation fee plus the prescribed medicines. Add anything else below.
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label for="bill-additional" class="block text-xs text-[#64748B] mb-1">Additional charges (₹)</label>
                  <input id="bill-additional" type="number" min="0" step="0.01" [(ngModel)]="additionalCharges" class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white" />
                </div>
                <div>
                  <label for="bill-discount" class="block text-xs text-[#64748B] mb-1">Discount (₹)</label>
                  <input id="bill-discount" type="number" min="0" step="0.01" [(ngModel)]="discount" class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white" />
                </div>
                <div>
                  <label for="bill-tax" class="block text-xs text-[#64748B] mb-1">Tax (₹)</label>
                  <input id="bill-tax" type="number" min="0" step="0.01" [(ngModel)]="tax" class="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white" />
                </div>
              </div>
              @if (billError) {
                <p class="text-sm text-red-600 mt-3" id="bill-error">{{ billError }}</p>
              }
              <div class="mt-4 flex justify-end">
                <button
                  id="generate-bill-button"
                  (click)="generateBill()"
                  [disabled]="isGeneratingBill"
                  class="px-5 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50"
                >
                  {{ isGeneratingBill ? 'Generating...' : 'Generate Bill' }}
                </button>
              </div>
            </div>
          }
          <div class="border-t border-gray-200 p-4 flex justify-end gap-3">
            <button
              (click)="print()"
              class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]"
            >
              <span class="material-symbols-outlined text-lg">print</span> Print
            </button>
            <button
              (click)="downloadPdf()"
              [disabled]="isDownloading"
              class="flex items-center gap-2 px-4 py-2 bg-[#0052CC] text-white rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50"
            >
              <span class="material-symbols-outlined text-lg">download</span>
              {{ isDownloading ? 'Downloading...' : 'Download PDF' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  imports: [RouterLink, DatePipe, FormsModule],
})
export class PrescriptionDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private prescriptionService = inject(PrescriptionService);
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Rupees as typed; sent as paise.
  additionalCharges: number | null = null;
  discount: number | null = null;
  tax: number | null = null;
  isGeneratingBill = false;
  billError = '';

  id: string | null = null;
  prescription: Prescription | undefined;
  isLoading = false;
  isDownloading = false;
  error = '';

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.loadPrescription(this.id);
    }
  }

  loadPrescription(id: string) {
    this.isLoading = true;
    this.error = '';
    this.prescriptionService.getPrescriptionById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.prescription = res.data;
        } else {
          this.error = 'Prescription not found';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load prescription';
        this.isLoading = false;
      },
    });
  }

  /** Only front-desk roles may bill (the API refuses everyone else), so others are not offered the form. */
  get canGenerateBill(): boolean {
    const role = this.authService.currentUserValue?.role;
    return role === 'ADMIN' || role === 'RECEPTIONIST';
  }

  generateBill() {
    if (!this.id || this.isGeneratingBill) return;
    const toPaise = (rupees: number | null) => Math.round((rupees ?? 0) * 100);
    if ([this.additionalCharges, this.discount, this.tax].some((v) => (v ?? 0) < 0)) {
      this.billError = 'Amounts cannot be negative.';
      return;
    }
    this.isGeneratingBill = true;
    this.billError = '';
    this.billingService
      .createBill(this.id, {
        prescriptionId: this.id,
        additionalChargesInPaisa: toPaise(this.additionalCharges),
        discountInPaisa: toPaise(this.discount),
        taxInPaisa: toPaise(this.tax),
      })
      .subscribe({
        next: (res) => {
          this.isGeneratingBill = false;
          if (res.success && res.data?.id) {
            this.toast.success('Bill generated');
            this.router.navigate(['/', hospitalCodeFrom(this.route), 'billing', res.data.id]);
          } else {
            this.billError = res.message || 'The bill could not be generated.';
          }
        },
        error: (err) => {
          this.isGeneratingBill = false;
          // A second attempt for the same prescription is refused by the server; say so plainly.
          this.billError =
            err?.status === 409
              ? 'A bill already exists for this prescription. Open it from Billing.'
              : err?.error?.message || 'The bill could not be generated.';
        },
      });
  }

  print() {
    window.print();
  }

  downloadPdf() {
    if (!this.id || this.isDownloading) return;
    this.isDownloading = true;
    this.prescriptionService.downloadPdf(this.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prescription-${this.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
      },
      error: (err) => {
        console.error('PDF download failed:', err);
        this.isDownloading = false;
      },
    });
  }
}
