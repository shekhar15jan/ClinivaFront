import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { BookingRequestsComponent } from './booking-requests';
import { PublicBookingComponent } from './public-booking';

describe('public booking page', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;

  function create(): PublicBookingComponent {
    TestBed.configureTestingModule({
      providers: [
        { provide: BookingService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ hospitalCode: 'CITY' }) } } },
      ],
    });
    const f = TestBed.createComponent(PublicBookingComponent);
    f.detectChanges();
    return f.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    service = {
      clinic: vi.fn().mockReturnValue(of({ name: 'City Clinic', logoUrl: null, timezone: null })),
      doctors: vi.fn().mockReturnValue(of([{ id: 'd1', name: 'Dr. Rao', specialization: 'General', feeInPaisa: 50000 }])),
      times: vi.fn().mockReturnValue(of(['10:00:00', '11:00:00'])),
      submit: vi.fn().mockReturnValue(of({ reference: 'BK-1', message: 'Your request is with City Clinic.' })),
    };
  });

  it('shows the clinic and its doctors', () => {
    const c = create();
    expect(c.clinic?.name).toBe('City Clinic');
    expect(c.doctors.length).toBe(1);
    expect(c.notFound).toBe(false);
  });

  it('says booking is unavailable when the clinic has not opened it', () => {
    service['clinic'].mockReturnValue(throwError(() => ({ status: 404 })));
    const c = create();
    expect(c.notFound).toBe(true);
  });

  it('loads free times once a doctor and a day are chosen, and clears a chosen time on change', () => {
    const c = create();
    c.pickDoctor('d1');
    c.pickDate('2026-11-05');
    expect(service['times']).toHaveBeenCalledWith('CITY', 'd1', '2026-11-05');
    expect(c.times).toEqual(['10:00:00', '11:00:00']);
    c.time = '10:00:00';
    c.pickDate('2026-11-06');
    expect(c.time).toBe('');
  });

  it('needs a name and a phone before sending', () => {
    const c = create();
    c.send();
    expect(service['submit']).not.toHaveBeenCalled();
    expect(c.error).toContain('name');
  });

  it('sends the request and shows the receipt', () => {
    const c = create();
    c.doctorId = 'd1'; c.date = '2026-11-05'; c.time = '10:00:00'; c.name = ' Asha '; c.phone = '9876543210';
    c.send();
    expect(service['submit']).toHaveBeenCalledWith('CITY', expect.objectContaining({ name: 'Asha', phone: '9876543210', doctorId: 'd1', website: '' }));
    expect(c.receipt?.reference).toBe('BK-1');
  });

  it('shows the clinic message when the time was taken, and reloads the times', () => {
    service['submit'].mockReturnValue(throwError(() => ({ error: { message: 'That time is no longer free.' } })));
    const c = create();
    c.doctorId = 'd1'; c.date = '2026-11-05'; c.time = '10:00:00'; c.name = 'Asha'; c.phone = '9876543210';
    c.send();
    expect(c.error).toBe('That time is no longer free.');
    expect(c.receipt).toBeNull();
    expect(service['times']).toHaveBeenCalled();
  });
});

describe('booking requests (front desk)', () => {
  let service: Record<string, ReturnType<typeof vi.fn>>;
  let toast: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  const request = { id: 'r1', reference: 'BK-1', doctorId: 'd1', doctorName: 'Dr. Rao', date: '2026-11-05', time: '10:00:00', name: 'Asha', phone: '9876543210', email: null, reason: null, status: 'NEW', createdAt: '' };

  function create(): BookingRequestsComponent {
    TestBed.configureTestingModule({ providers: [{ provide: BookingService, useValue: service }, { provide: ToastService, useValue: toast }] });
    const f = TestBed.createComponent(BookingRequestsComponent);
    f.detectChanges();
    return f.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    toast = { success: vi.fn(), error: vi.fn() };
    service = {
      open: vi.fn().mockReturnValue(of([request])),
      book: vi.fn().mockReturnValue(of({})),
      decline: vi.fn().mockReturnValue(of({})),
    };
  });

  it('lists the waiting requests', () => {
    expect(create().requests.length).toBe(1);
  });

  it('books a request and reloads the list', () => {
    const c = create();
    c.book(request);
    expect(service['book']).toHaveBeenCalledWith('r1');
    expect(toast.success).toHaveBeenCalledWith('Booked.');
    expect(service['open']).toHaveBeenCalledTimes(2);
  });

  it('declines a request', () => {
    create().decline(request);
    expect(service['decline']).toHaveBeenCalledWith('r1');
  });

  it('shows the reason when booking is refused (the doctor is busy then)', () => {
    service['book'].mockReturnValue(throwError(() => ({ error: { message: 'Slot taken' } })));
    create().book(request);
    expect(toast.error).toHaveBeenCalledWith('Slot taken');
  });
});
