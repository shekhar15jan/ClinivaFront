import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Prescription } from '../../../../core/models/prescription.model';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

const PAGE_SIZE = 20;

/**
 * The clinic's prescriptions, newest first, from the server, searchable by patient or doctor. It showed two made-up
 * prescriptions ("Rahul Sharma", "Priya Patel") and never called the server. Doctors and nurses use it on phones.
 */
@Component({
  selector: 'app-prescription-list',
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Prescriptions</h1>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <div class="relative w-full max-w-sm">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input id="prescription-search" type="search" [(ngModel)]="searchQuery" (input)="onSearchInput()"
                   aria-label="Search prescriptions" placeholder="Patient name or ID, or doctor"
                   class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]" />
          </div>
        </div>

        @if (isLoading) {
          <div class="flex justify-center py-12"><div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div></div>
        } @else if (error) {
          <div class="p-6 text-sm text-red-600 flex items-center justify-between">
            <span id="prescriptions-error">{{ error }}</span>
            <button type="button" (click)="load()" class="text-[#0052CC] hover:underline">Retry</button>
          </div>
        } @else if (prescriptions.length === 0) {
          <p class="text-center py-12 text-sm text-gray-500">
            {{ searchQuery.trim() ? 'No prescription matches "' + searchQuery.trim() + '".' : 'No prescriptions yet.' }}
          </p>
        } @else {
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-[#F8FAFC] text-left">
                  <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Patient</th>
                  <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Doctor</th>
                  <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Diagnosis</th>
                  <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Medicines</th>
                  <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Date</th>
                  <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (rx of prescriptions; track rx.id) {
                  <tr class="border-t border-gray-100 hover:bg-[#F8FAFC]">
                    <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">{{ rx.patient.fullName || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-[#475569]">{{ rx.doctor.fullName || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-[#475569]">{{ rx.diagnosis || '—' }}</td>
                    <td class="px-4 py-3 text-sm text-[#64748B]">{{ rx.medicines.length }} {{ rx.medicines.length === 1 ? 'item' : 'items' }}</td>
                    <td class="px-4 py-3 text-sm text-[#64748B]">{{ rx.createdAt | date: 'mediumDate' }}</td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1">
                        <a [routerLink]="[rx.id]" class="text-[#64748B] hover:text-[#0052CC] p-1 rounded" [attr.aria-label]="'View prescription for ' + rx.patient.fullName">
                          <span class="material-symbols-outlined text-lg">visibility</span>
                        </a>
                        <button type="button" (click)="downloadPdf(rx)" [disabled]="downloadingId === rx.id"
                                class="text-[#64748B] hover:text-[#0052CC] p-1 rounded disabled:opacity-50"
                                [attr.aria-label]="'Download PDF for ' + rx.patient.fullName">
                          <span class="material-symbols-outlined text-lg">download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="md:hidden divide-y divide-outline-variant">
            @for (rx of prescriptions; track rx.id) {
              <div class="px-4 py-3.5 flex flex-col gap-3 bg-surface">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-title-md font-semibold text-on-surface truncate">{{ rx.patient.fullName || '—' }}</span>
                  <span class="text-label-sm text-on-surface-variant shrink-0">{{ rx.createdAt | date: 'mediumDate' }}</span>
                </div>
                <div class="flex flex-col gap-1 text-body-sm text-on-surface-variant">
                  <span class="flex items-center gap-2"><span class="material-symbols-outlined text-base">stethoscope</span>{{ rx.doctor.fullName || '—' }}</span>
                  @if (rx.diagnosis) {
                    <span class="flex items-center gap-2"><span class="material-symbols-outlined text-base">diagnosis</span>{{ rx.diagnosis }}</span>
                  }
                  <span class="flex items-center gap-2"><span class="material-symbols-outlined text-base">medication</span>{{ rx.medicines.length }} {{ rx.medicines.length === 1 ? 'medicine' : 'medicines' }}</span>
                </div>
                <div class="flex gap-2">
                  <a [routerLink]="[rx.id]" class="flex-1 text-center min-h-touch py-2.5 rounded-lg bg-[#0052CC] text-white text-sm font-medium">View</a>
                  <button type="button" (click)="downloadPdf(rx)" [disabled]="downloadingId === rx.id"
                          class="flex-1 min-h-touch py-2.5 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50">
                    {{ downloadingId === rx.id ? 'Downloading...' : 'PDF' }}
                  </button>
                </div>
              </div>
            }
          </div>

          @if (totalPages > 1) {
            <nav class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm" aria-label="Pages">
              <span class="text-[#64748B]">{{ totalElements }} prescriptions &middot; page {{ page + 1 }} of {{ totalPages }}</span>
              <div class="flex gap-2">
                <button id="prescriptions-prev" type="button" (click)="goToPage(page - 1)" [disabled]="page === 0"
                        class="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Previous</button>
                <button id="prescriptions-next" type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages - 1"
                        class="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
              </div>
            </nav>
          }
        }
      </div>
    </div>
  `,
  imports: [RouterLink, DatePipe, FormsModule],
})
export class PrescriptionList implements OnInit, OnDestroy {
  private prescriptionService = inject(PrescriptionService);
  private toast = inject(ToastService);

  prescriptions: Prescription[] = [];
  page = 0;
  totalPages = 1;
  totalElements = 0;
  searchQuery = '';
  isLoading = false;
  error = '';
  downloadingId: string | null = null;
  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load(0);
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  load(page = this.page): void {
    this.isLoading = true;
    this.error = '';
    this.prescriptionService.getPrescriptions(page, PAGE_SIZE, this.searchQuery).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.prescriptions = res.data.content;
          this.page = res.data.pageNumber;
          this.totalPages = Math.max(1, res.data.totalPages);
          this.totalElements = res.data.totalElements;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'The prescriptions could not be loaded.';
        this.isLoading = false;
      },
    });
  }

  /** Searches once typing pauses, from the first page. */
  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(0), 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) return;
    this.load(page);
  }

  /** The PDF button did nothing before. */
  downloadPdf(rx: Prescription): void {
    if (this.downloadingId) return;
    this.downloadingId = rx.id;
    this.prescriptionService.downloadPdf(rx.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prescription-${(rx.patient.fullName || rx.id).replace(/\s+/g, '-')}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: (err) => {
        this.downloadingId = null;
        this.toast.error(err?.error?.message || 'The PDF could not be downloaded.');
      },
    });
  }
}
