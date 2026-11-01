import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BookingRequestView, BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/** Requests from the clinic's public booking page: the front desk phones, then books or declines each one. */
@Component({
  selector: 'app-booking-requests',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">Online booking requests</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Patients asked for these times on the clinic's booking page. Phone them, then book or decline.</p>

      <div class="space-y-2" id="booking-requests">
        @for (r of requests; track r.id) {
          <div class="bg-white rounded-xl border border-outline-variant p-3" [attr.data-request]="r.reference">
            <div class="flex justify-between gap-2 flex-wrap">
              <p class="font-semibold">{{ r.name }} <span class="text-sm font-normal text-slate-600">{{ r.reference }}</span></p>
              <a [href]="'tel:' + r.phone" class="text-sm font-semibold text-primary">{{ r.phone }}</a>
            </div>
            <p class="text-sm text-slate-700">{{ r.doctorName }} · {{ r.date | date: 'EEE d MMM' }} at {{ r.time.slice(0, 5) }}{{ r.reason ? ' · ' + r.reason : '' }}</p>
            <div class="flex gap-2 mt-2">
              <button type="button" class="book bg-emerald-600 text-white px-4 min-h-touch rounded-lg text-sm font-medium" [disabled]="busy" (click)="book(r)">Book</button>
              <button type="button" class="decline bg-white border border-outline-variant px-4 min-h-touch rounded-lg text-sm" [disabled]="busy" (click)="decline(r)">Decline</button>
            </div>
          </div>
        }
        @if (loaded && requests.length === 0) { <p class="text-sm text-slate-600" id="no-requests">No requests waiting.</p> }
      </div>
    </div>
  `,
})
export class BookingRequestsComponent implements OnInit {
  private service = inject(BookingService);
  private toast = inject(ToastService);

  requests: BookingRequestView[] = [];
  loaded = false;
  busy = false;

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.service.open().subscribe({
      next: (list) => { this.requests = list; this.loaded = true; },
      error: () => { this.loaded = true; this.toast.error('Could not load the requests.'); },
    });
  }

  book(r: BookingRequestView): void {
    this.run(this.service.book(r.id), 'Booked.');
  }

  decline(r: BookingRequestView): void {
    this.run(this.service.decline(r.id), 'Declined.');
  }

  private run(call: ReturnType<BookingService['book']>, done: string): void {
    this.busy = true;
    call.subscribe({
      next: () => { this.busy = false; this.toast.success(done); this.load(); },
      error: (e) => { this.busy = false; this.toast.error(e?.error?.message ?? 'Could not do that.'); this.load(); },
    });
  }
}
