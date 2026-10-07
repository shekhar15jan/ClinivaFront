import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { EffectiveLicenseService } from '../../../../core/services/effective-license.service';
import { DoctorService } from '../../../../core/services/doctor.service';
import { DepartmentService } from '../../../../core/services/department.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Doctor } from '../../../../core/models/doctor.model';
import { Department } from '../../../../core/models/department.model';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';

/**
 * The doctors directory. The search box and the specialization filter used to do nothing (and the filter offered a
 * fixed list); they now search the clinic's doctors on the server, by name or specialization, and by department.
 */
@Component({
  selector: 'app-doctor-list',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Doctors</h1>
        @if (canAdd) {
          <button
            [routerLink]="['new']"
            class="bg-[#0052CC] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b] flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-lg">add</span> Add Doctor
          </button>
        }
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              >search</span
            >
            <input
              id="doctor-search"
              type="search"
              placeholder="Search by name or specialization"
              aria-label="Search doctors"
              [(ngModel)]="query"
              (ngModelChange)="onQuery()"
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </div>
          <select
            id="doctor-specialization"
            aria-label="Specialization"
            [(ngModel)]="specialization"
            (ngModelChange)="reload()"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All specializations</option>
            @for (s of specializations; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
          @if (departments.length) {
            <select
              id="doctor-department"
              aria-label="Department"
              [(ngModel)]="departmentId"
              (ngModelChange)="reload()"
              class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
            >
              <option value="">All departments</option>
              @for (d of departments; track d.id) {
                <option [value]="d.id">{{ d.name }}</option>
              }
            </select>
          }
        </div>

        @if (loadError) {
          <div class="m-4 p-3 rounded-lg bg-red-50 text-sm text-red-700" id="doctors-error">{{ loadError }}</div>
        }
        @if (!isLoading && !loadError && doctors.length === 0) {
          <p class="px-4 py-8 text-center text-sm text-[#475569]" id="no-doctors">
            {{ filtered ? 'No doctor matches. Try another name or filter.' : 'No doctors yet.' }}
          </p>
        }

        <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC] text-left">
              <th class="px-4 py-3 text-xs font-semibold text-[#475569] uppercase">Doctor</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#475569] uppercase">Specialization</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#475569] uppercase">Department</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#475569] uppercase">Fee</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#475569] uppercase">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#475569] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading) {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-sm text-[#475569]">
                  Loading doctors...
                </td>
              </tr>
            }
            @for (doc of doctors; track doc.id) {
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
                      <p class="text-xs text-[#475569]">{{ doc.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-sm text-[#475569]">{{ doc.specialization }}</td>
                <td class="px-4 py-3 text-sm text-[#475569]">{{ doc.departmentName || '—' }}</td>
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">
                  {{ doc.consultationFeeInPaisa | money }}
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
                      [attr.aria-label]="'View ' + doc.fullName"
                      class="text-[#475569] hover:text-[#0052CC] p-1 rounded"
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
          @for (doc of doctors; track doc.id) {
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
                @if (doc.departmentName) {
                  <span class="text-on-surface-variant">|</span>
                  <span>{{ doc.departmentName }}</span>
                }
              </div>
              <div class="flex items-center justify-between">
                <span class="text-title-md font-semibold text-on-surface">{{ doc.consultationFeeInPaisa | money }}</span>
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
                  [attr.aria-label]="'View ' + doc.fullName"
                  class="flex items-center gap-1 px-4 min-h-touch text-label-sm font-medium text-white bg-primary rounded-lg"
                >
                  <span class="material-symbols-outlined text-sm">visibility</span> View
                </button>
              </div>
            </div>
          }
        </div>
      </div>
      @if (totalElements > pageSize) {
        <app-paginator [totalElements]="totalElements" [pageSize]="pageSize" [currentPage]="page" (pageChange)="onPage($event)"></app-paginator>
      }
    </div>
  `,
  imports: [MoneyPipe, RouterLink, FormsModule, PaginatorComponent],
})
export class DoctorList implements OnInit, OnDestroy {
  private doctorService = inject(DoctorService);
  private departmentService = inject(DepartmentService);
  /** Departments are a plan module; without it the doctor screens do not mention them. */
  private readonly hasDepartments = inject(EffectiveLicenseService).activeModules().includes('DEPARTMENT');
  private auth = inject(AuthService);

  doctors: Doctor[] = [];
  specializations: string[] = [];
  departments: Department[] = [];
  isLoading = false;
  loadError = '';

  query = '';
  specialization = '';
  departmentId = '';
  page = 0;
  pageSize = 20;
  totalElements = 0;
  private debounce: ReturnType<typeof setTimeout> | undefined;

  /** Adding doctors needs DOCTOR_MANAGE (the API refuses others). */
  get canAdd(): boolean {
    return this.auth.can('DOCTOR_MANAGE');
  }

  get filtered(): boolean {
    return !!(this.query.trim() || this.specialization || this.departmentId);
  }

  ngOnInit() {
    this.load();
    this.doctorService.getSpecializations().subscribe({ next: (list) => (this.specializations = list), error: () => (this.specializations = []) });
    if (this.hasDepartments) {
      this.departmentService.getDepartments().subscribe({ next: (list) => (this.departments = list), error: () => (this.departments = []) });
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.debounce);
  }

  /** Searches as the user types, once they pause. */
  onQuery(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.reload(), 300);
  }

  reload(): void {
    this.page = 0;
    this.load();
  }

  onPage(event: { page: number; size: number }): void {
    this.page = event.page;
    this.pageSize = event.size;
    this.load();
  }

  load() {
    this.isLoading = true;
    this.loadError = '';
    this.doctorService
      .getDoctors(this.page, this.pageSize, {
        q: this.query.trim(),
        specialization: this.specialization,
        departmentId: this.departmentId,
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.doctors = res.data.content;
            this.totalElements = res.data.totalElements;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.loadError = err?.error?.message || 'The doctors could not be loaded.';
        },
      });
  }
}
