import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DoctorService } from '../../../../core/services/doctor.service';
import { AvailabilityDto, Doctor } from '../../../../core/models/doctor.model';

export interface ScheduleDay {
  key: string;
  name: string;
  enabled: boolean;
  start: string;
  end: string;
}

export const DEFAULT_START = '09:00';
export const DEFAULT_END = '17:00';
const DAYS: [string, string][] = [
  ['MONDAY', 'Monday'], ['TUESDAY', 'Tuesday'], ['WEDNESDAY', 'Wednesday'], ['THURSDAY', 'Thursday'],
  ['FRIDAY', 'Friday'], ['SATURDAY', 'Saturday'], ['SUNDAY', 'Sunday'],
];

/** The API sends times as HH:mm:ss; the time inputs and the request use HH:mm. */
export const toHm = (time: string) => (time ?? '').slice(0, 5);

/** Schedule rows for all seven days, switched on and timed where the doctor already has hours. */
export function scheduleFrom(availability: AvailabilityDto[]): ScheduleDay[] {
  return DAYS.map(([key, name]) => {
    const hours = availability.find((a) => a.dayOfWeek === key);
    return {
      key,
      name,
      enabled: !!hours,
      start: hours ? toHm(hours.startTime) : DEFAULT_START,
      end: hours ? toHm(hours.endTime) : DEFAULT_END,
    };
  });
}

/** The first problem with the schedule, or an empty string when it can be saved. */
export function scheduleProblem(days: ScheduleDay[]): string {
  for (const d of days.filter((x) => x.enabled)) {
    if (!d.start || !d.end) return `${d.name}: enter a start and an end time.`;
    if (d.start >= d.end) return `${d.name}: the end time must be after the start time.`;
  }
  return '';
}

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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-3">Consultation Fee</h3>
            <p id="doctor-fee" class="text-2xl font-bold text-[#0052CC]">
              ₹{{ (doctor.consultationFeeInPaisa || 0) / 100 }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-[#1E293B] mb-3">Experience</h3>
            <p id="doctor-experience" class="text-2xl font-bold text-[#1E293B]">
              {{ doctor.experienceYears !== null && doctor.experienceYears !== undefined ? doctor.experienceYears + ' years' : '—' }}
            </p>
          </div>
        </div>
      }

      @if (!isLoading && doctor) {
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-sm font-semibold text-[#1E293B]">Weekly Schedule</h3>
            <button
              id="save-availability"
              type="button"
              (click)="saveSchedule()"
              [disabled]="isSaving"
              class="px-4 py-2 rounded-lg bg-[#0052CC] text-white text-sm font-medium disabled:opacity-50"
            >
              {{ isSaving ? 'Saving...' : 'Save schedule' }}
            </button>
          </div>
          <p class="text-xs text-[#64748B] mb-4">
            Patients can book 30-minute appointments inside these hours. A day that is switched off has no slots.
          </p>
          @if (saved) {
            <p id="availability-saved" class="mb-3 text-sm text-[#059669]" role="status">Schedule saved.</p>
          }
          @if (scheduleError) {
            <p id="availability-error" class="mb-3 text-sm text-[#DC2626]" role="alert">{{ scheduleError }}</p>
          }
          <div class="space-y-2">
            @for (day of schedule; track day.key) {
              <div class="flex flex-wrap items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#F8FAFC]" [attr.data-day]="day.key">
                <label class="flex items-center gap-2 w-36 text-sm font-medium text-[#475569]">
                  <input type="checkbox" [(ngModel)]="day.enabled" [name]="'on-' + day.key" [attr.aria-label]="day.name + ' available'" />
                  {{ day.name }}
                </label>
                @if (day.enabled) {
                  <input type="time" [(ngModel)]="day.start" [name]="'start-' + day.key" [attr.aria-label]="day.name + ' start'" class="border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                  <span class="text-sm text-[#64748B]">to</span>
                  <input type="time" [(ngModel)]="day.end" [name]="'end-' + day.key" [attr.aria-label]="day.name + ' end'" class="border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                } @else {
                  <span class="text-sm text-[#94A3B8]">Not available</span>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  imports: [RouterLink, FormsModule],
})
export class DoctorDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private doctorService = inject(DoctorService);

  doctor: Doctor | undefined;
  isLoading = false;
  schedule: ScheduleDay[] = scheduleFrom([]);
  isSaving = false;
  saved = false;
  scheduleError = '';
  private doctorId = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.doctorId = id;
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
    this.doctorService.getAvailability(id).subscribe({
      next: (res) => {
        if (res.success) this.schedule = scheduleFrom(res.data ?? []);
      },
      error: () => {
        this.scheduleError = 'The current schedule could not be loaded.';
      },
    });
  }

  saveSchedule() {
    this.saved = false;
    this.scheduleError = scheduleProblem(this.schedule);
    if (this.scheduleError) return;
    this.isSaving = true;
    const availability = this.schedule
      .filter((d) => d.enabled)
      .map((d) => ({ dayOfWeek: d.key, startTime: d.start, endTime: d.end }));
    this.doctorService.setAvailability(this.doctorId, { availability }).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) this.saved = true;
        else this.scheduleError = res.message || 'The schedule could not be saved.';
      },
      error: (err) => {
        this.isSaving = false;
        this.scheduleError = err?.error?.message || 'The schedule could not be saved.';
      },
    });
  }
}
