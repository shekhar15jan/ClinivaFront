import { Component, OnInit, inject } from '@angular/core';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../../../core/services/review.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-my-appointments',
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 class="text-headline-md text-on-surface">My Appointments</h2>
      </div>
      <p class="text-sm text-outline mb-4" id="booking-note">To book or change an appointment, please contact the clinic.</p>

      @if (isLoading) {
        <div class="flex justify-center py-12"><div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div></div>
      } @else if (appointments.length === 0) {
        <div class="text-center py-12 text-sm text-outline">No appointments found.</div>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div class="hidden md:block">
            <table class="w-full">
              <thead><tr class="bg-surface-container text-left">
                <th class="px-4 py-3 text-xs font-semibold uppercase">Date</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Time</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Doctor</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Token #</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Status</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Actions</th>
              </tr></thead>
              <tbody>
                @for (apt of appointments; track apt.id) {
                  <tr class="border-t border-outline-variant">
                    <td class="px-4 py-3 text-sm text-on-surface">{{ apt.appointmentDate | date:'mediumDate' }}</td>
                    <td class="px-4 py-3 text-sm text-on-surface-variant">{{ time(apt.appointmentTime) }}</td>
                    <td class="px-4 py-3 text-sm text-on-surface">{{ apt.doctor.fullName }}</td>
                    <td class="px-4 py-3 text-sm font-mono">#{{ apt.tokenNumber }}</td>
                    <td class="px-4 py-3"><span [class]="statusClass(apt.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ apt.status }}</span></td>
                    <td class="px-4 py-3">
                      @if (apt.status === 'PENDING') {
                        <button (click)="cancelAppointment(apt.id)" class="text-sm text-red-600 hover:underline">Cancel</button>
                      }
                      @if (apt.status === 'COMPLETED') {
                        @if (reviewed.has(apt.id)) {
                          <span class="text-xs text-outline">Reviewed</span>
                        } @else {
                          <button (click)="startReview(apt.id)" class="rate-visit text-sm text-medical-blue hover:underline">Rate this visit</button>
                        }
                      }
                    </td>
                  </tr>

                }
              </tbody>
            </table>
          </div>
          <div class="md:hidden divide-y divide-outline-variant">
            @for (apt of appointments; track apt.id) {
              <div class="px-4 py-3.5 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-on-surface">{{ apt.appointmentDate | date:'mediumDate' }} at {{ time(apt.appointmentTime) }}</span>
                  <span [class]="statusClass(apt.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ apt.status }}</span>
                </div>
                <p class="text-sm text-on-surface">{{ apt.doctor.fullName }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-outline">Token #{{ apt.tokenNumber }}</span>
                  @if (apt.status === 'PENDING') {
                    <button (click)="cancelAppointment(apt.id)" class="text-xs text-red-600 hover:underline">Cancel</button>
                  }
                  @if (apt.status === 'COMPLETED') {
                    @if (reviewed.has(apt.id)) {
                      <span class="text-xs text-outline">Reviewed</span>
                    } @else {
                      <button (click)="startReview(apt.id)" class="text-xs text-medical-blue hover:underline">Rate this visit</button>
                    }
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (reviewing) {
        <div class="mt-6 bg-white rounded-xl border border-outline-variant p-4 sm:p-6 max-w-lg space-y-3" id="review-form">
          <h3 class="text-base font-semibold text-on-surface">Rate your visit</h3>
          <div>
            <label for="review-rating" class="block text-sm font-medium text-gray-700 mb-1">How was your visit?</label>
            <select id="review-rating" [ngModel]="reviewRating" (ngModelChange)="reviewRating = +$event" class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Fair</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Very poor</option>
            </select>
          </div>
          <div>
            <label for="review-text" class="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
            <textarea id="review-text" rows="3" [(ngModel)]="reviewText" class="w-full px-3 py-2 border rounded-lg text-sm"></textarea>
          </div>
          @if (reviewError) { <p class="text-sm text-red-600" id="review-error">{{ reviewError }}</p> }
          <div class="flex gap-3">
            <button type="button" (click)="cancelReview()" class="px-4 py-2 text-sm border rounded-lg">Cancel</button>
            <button type="button" id="submit-review" (click)="submitReview()" [disabled]="isReviewing" class="px-5 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50">{{ isReviewing ? 'Sending...' : 'Send review' }}</button>
          </div>
        </div>
      }
    </div>
  `,
  imports: [DatePipe, FormsModule],
})
export class MyAppointments implements OnInit {
  private appointmentService = inject(AppointmentService);
  private reviewService = inject(ReviewService);
  private toast = inject(ToastService);

  appointments: Appointment[] = [];
  isLoading = false;

  ngOnInit() { this.loadAppointments(); }

  /** 09:00:00 -> 09:00 */
  time(value: string): string { return (value ?? '').slice(0, 5); }

  loadAppointments() {
    this.isLoading = true;
    this.appointmentService.getPatientAppointments().subscribe({
      next: (res) => { if (res.success) { this.appointments = res.data || []; } this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }

  // Rating a completed visit.
  reviewing: string | null = null;
  reviewed = new Set<string>();
  reviewRating = 5;
  reviewText = '';
  reviewError = '';
  isReviewing = false;

  startReview(appointmentId: string) {
    this.reviewing = appointmentId;
    this.reviewRating = 5;
    this.reviewText = '';
    this.reviewError = '';
  }

  cancelReview() {
    this.reviewing = null;
  }

  submitReview() {
    if (!this.reviewing || this.isReviewing) return;
    const appointmentId = this.reviewing;
    this.isReviewing = true;
    this.reviewError = '';
    // The server takes the patient and the doctor from the login and the visit; only the rating and words are ours.
    this.reviewService
      .submit({ appointmentId, rating: this.reviewRating, reviewText: this.reviewText.trim() || undefined })
      .subscribe({
        next: () => {
          this.isReviewing = false;
          this.reviewed.add(appointmentId);
          this.reviewing = null;
          this.toast.success('Thank you. Your review will appear once the clinic approves it.');
        },
        error: (err) => {
          this.isReviewing = false;
          if (err?.status === 409) {
            this.reviewed.add(appointmentId);
            this.reviewing = null;
            this.toast.info('You have already reviewed this visit.');
            return;
          }
          this.reviewError = err?.error?.message || 'Your review could not be sent.';
        },
      });
  }

  cancelAppointment(id: string) {
    this.appointmentService.cancelAppointment(id).subscribe({ next: () => this.loadAppointments() });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'APPROVED': case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}
