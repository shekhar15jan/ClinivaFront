import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BookingClinic, BookingDoctor, BookingReceipt, BookingService } from '../../core/services/booking.service';

function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * The clinic's public booking page, for anyone with the link (no sign-in): pick a doctor, a day and a free time, give a
 * name and phone, and the front desk calls to confirm. Nothing here shows patients or books on its own.
 */
@Component({
  selector: 'app-public-booking',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen bg-blue-50 p-4">
      <div class="max-w-lg mx-auto">
        @if (notFound) {
          <div class="bg-white rounded-xl border border-outline-variant p-5 mt-8" id="booking-closed">
            <h1 class="text-xl font-semibold">Online booking is not available</h1>
            <p class="text-sm text-slate-700 mt-1">Please phone the clinic to book an appointment.</p>
          </div>
        } @else if (clinic) {
          <div class="bg-[#0052CC] text-white rounded-xl p-4 mb-3">
            <p class="text-xs opacity-90">Book an appointment</p>
            <h1 class="text-xl font-bold" id="clinic-name">{{ clinic.name }}</h1>
          </div>

          @if (receipt) {
            <div class="bg-white rounded-xl border border-emerald-300 p-5" id="booking-done">
              <h2 class="text-lg font-semibold text-emerald-700">Request sent</h2>
              <p class="text-sm text-slate-800 mt-1">{{ receipt.message }}</p>
            </div>
          } @else {
            <form class="bg-white rounded-xl border border-outline-variant p-4 space-y-3" (ngSubmit)="send()" id="booking-form">
              <div>
                <p class="text-sm font-medium mb-1">Doctor</p>
                <div class="flex flex-wrap gap-2" id="doctors">
                  @for (d of doctors; track d.id) {
                    <button type="button" class="doctor px-3 min-h-touch rounded-full text-sm border"
                      [class]="doctorId === d.id ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'"
                      (click)="pickDoctor(d.id)">{{ d.name }}{{ d.specialization ? ' · ' + d.specialization : '' }}</button>
                  }
                </div>
              </div>

              @if (doctorId) {
                <div>
                  <label class="text-sm font-medium" for="booking-date">Day</label>
                  <input id="booking-date" type="date" class="block w-full border border-outline-variant rounded-lg px-3 min-h-touch"
                    [min]="today" [max]="last" [ngModel]="date" (ngModelChange)="pickDate($event)" name="date" />
                </div>
              }

              @if (doctorId && date) {
                <div>
                  <p class="text-sm font-medium mb-1">Time</p>
                  <div class="flex flex-wrap gap-2" id="times">
                    @for (t of times; track t) {
                      <button type="button" class="time px-3 min-h-touch rounded-full text-sm border"
                        [class]="time === t ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'"
                        (click)="time = t">{{ t.slice(0, 5) }}</button>
                    }
                    @if (timesLoaded && times.length === 0) { <p class="text-sm text-slate-600" id="no-times">No free times that day. Try another day.</p> }
                  </div>
                </div>
              }

              @if (time) {
                <div class="space-y-2">
                  <input id="booking-name" name="name" [(ngModel)]="name" placeholder="Your name" maxlength="120" class="block w-full border border-outline-variant rounded-lg px-3 min-h-touch" />
                  <input id="booking-phone" name="phone" [(ngModel)]="phone" placeholder="Mobile number" inputmode="tel" maxlength="30" class="block w-full border border-outline-variant rounded-lg px-3 min-h-touch" />
                  <input id="booking-reason" name="reason" [(ngModel)]="reason" placeholder="Reason (optional)" maxlength="300" class="block w-full border border-outline-variant rounded-lg px-3 min-h-touch" />
                  <!-- Hidden from people; a script that fills every field gives itself away. -->
                  <input name="website" [(ngModel)]="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute -left-[9999px] h-0 w-0 opacity-0" />
                  @if (error) { <p class="text-sm text-red-700" id="booking-error">{{ error }}</p> }
                  <button type="submit" id="booking-send" [disabled]="busy" class="w-full bg-emerald-600 text-white min-h-touch rounded-lg font-medium disabled:opacity-50">
                    {{ busy ? 'Sending...' : 'Ask for this appointment' }}
                  </button>
                </div>
              }
            </form>
          }
        }
      </div>
    </div>
  `,
})
export class PublicBookingComponent implements OnInit {
  private service = inject(BookingService);
  private route = inject(ActivatedRoute);

  code = '';
  clinic: BookingClinic | null = null;
  notFound = false;
  doctors: BookingDoctor[] = [];
  doctorId = '';
  date = '';
  time = '';
  times: string[] = [];
  timesLoaded = false;
  name = '';
  phone = '';
  reason = '';
  website = '';
  error = '';
  busy = false;
  receipt: BookingReceipt | null = null;

  readonly today = isoDate(new Date());
  readonly last = isoDate(new Date(Date.now() + 60 * 86400000));

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('hospitalCode') ?? '';
    this.service.clinic(this.code).subscribe({
      next: (c) => {
        this.clinic = c;
        this.service.doctors(this.code).subscribe({ next: (d) => (this.doctors = d), error: () => (this.notFound = true) });
      },
      error: () => (this.notFound = true),
    });
  }

  pickDoctor(id: string): void {
    this.doctorId = id;
    this.time = '';
    this.loadTimes();
  }

  pickDate(value: string): void {
    this.date = value;
    this.time = '';
    this.loadTimes();
  }

  private loadTimes(): void {
    this.times = [];
    this.timesLoaded = false;
    if (!this.doctorId || !this.date) return;
    this.service.times(this.code, this.doctorId, this.date).subscribe({
      next: (t) => { this.times = t; this.timesLoaded = true; },
      error: (e) => { this.timesLoaded = true; this.error = e?.error?.message ?? 'Could not load the times.'; },
    });
  }

  send(): void {
    this.error = '';
    if (!this.name.trim() || !this.phone.trim()) {
      this.error = 'Enter your name and mobile number.';
      return;
    }
    this.busy = true;
    this.service.submit(this.code, {
      doctorId: this.doctorId, date: this.date, time: this.time, name: this.name.trim(), phone: this.phone.trim(),
      reason: this.reason.trim() || undefined, website: this.website,
    }).subscribe({
      next: (r) => { this.busy = false; this.receipt = r; },
      error: (e) => {
        this.busy = false;
        this.error = e?.error?.message ?? 'Could not send your request. Please try again or phone the clinic.';
        this.loadTimes();
      },
    });
  }
}
