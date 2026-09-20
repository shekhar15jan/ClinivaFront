import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { ReviewService } from '../../../../core/services/review.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Appointment } from '../../../../core/models/appointment.model';
import { MyAppointments } from './my-appointments';

const appointment = (id: string, status: Appointment['status']): Appointment => ({
  id,
  patient: { id: 'p1', fullName: 'Rahul Rao' },
  doctor: { id: 'd1', fullName: 'Dr. Anita' },
  appointmentDate: '2026-09-21',
  appointmentTime: '09:30:00',
  tokenNumber: 3,
  status,
});

describe('MyAppointments', () => {
  let appointments: { getPatientAppointments: ReturnType<typeof vi.fn>; cancelAppointment: ReturnType<typeof vi.fn> };
  let reviews: { submit: ReturnType<typeof vi.fn> };
  let toast: { success: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn> };

  function create() {
    appointments = {
      getPatientAppointments: vi.fn().mockReturnValue(of({ success: true, data: [appointment('a1', 'COMPLETED'), appointment('a2', 'PENDING')] })),
      cancelAppointment: vi.fn().mockReturnValue(of({ success: true })),
    };
    reviews = { submit: vi.fn().mockReturnValue(of({ success: true, data: {} })) };
    toast = { success: vi.fn(), info: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AppointmentService, useValue: appointments },
        { provide: ReviewService, useValue: reviews },
        { provide: ToastService, useValue: toast },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new MyAppointments());
    component.ngOnInit();
    return component;
  }

  it('lists the signed-in patient appointments without sending an id', () => {
    const component = create();
    expect(appointments.getPatientAppointments).toHaveBeenCalledWith();
    expect(component.appointments.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(component.isLoading).toBe(false);
  });

  it('shows times without seconds', () => {
    const component = create();
    expect(component.time('09:30:00')).toBe('09:30');
    expect(component.time(undefined as unknown as string)).toBe('');
  });

  it('cancels a pending appointment and reloads', () => {
    const component = create();
    component.cancelAppointment('a2');
    expect(appointments.cancelAppointment).toHaveBeenCalledWith('a2');
    expect(appointments.getPatientAppointments).toHaveBeenCalledTimes(2);
  });

  describe('rating a completed visit', () => {
    it('sends only the visit, rating and words: the server takes the patient and doctor from the login', () => {
      const component = create();
      component.startReview('a1');
      component.reviewRating = 4;
      component.reviewText = '  Kind and quick  ';
      component.submitReview();
      expect(reviews.submit).toHaveBeenCalledWith({ appointmentId: 'a1', rating: 4, reviewText: 'Kind and quick' });
      expect(component.reviewed.has('a1')).toBe(true);
      expect(component.reviewing).toBeNull();
      expect(toast.success).toHaveBeenCalled();
    });

    it('omits empty comments', () => {
      const component = create();
      component.startReview('a1');
      component.reviewText = '   ';
      component.submitReview();
      expect(reviews.submit.mock.calls[0][0].reviewText).toBeUndefined();
    });

    it('starts each review from a clean form', () => {
      const component = create();
      component.startReview('a1');
      component.reviewRating = 2;
      component.reviewText = 'old';
      component.startReview('a1');
      expect(component.reviewRating).toBe(5);
      expect(component.reviewText).toBe('');
    });

    it('treats a second review of the same visit as already done, not an error', () => {
      const component = create();
      reviews.submit.mockReturnValue(throwError(() => ({ status: 409 })));
      component.startReview('a1');
      component.submitReview();
      expect(component.reviewed.has('a1')).toBe(true);
      expect(component.reviewError).toBe('');
      expect(toast.info).toHaveBeenCalledWith('You have already reviewed this visit.');
    });

    it('keeps the form open with the reason when the server refuses', () => {
      const component = create();
      reviews.submit.mockReturnValue(throwError(() => ({ status: 400, error: { message: 'You can review a visit once it is completed.' } })));
      component.startReview('a1');
      component.submitReview();
      expect(component.reviewError).toBe('You can review a visit once it is completed.');
      expect(component.reviewing).toBe('a1');
      expect(component.isReviewing).toBe(false);
    });

    it('does nothing when no visit is being rated, or one is already being sent', () => {
      const component = create();
      component.submitReview();
      component.startReview('a1');
      component.isReviewing = true;
      component.submitReview();
      expect(reviews.submit).not.toHaveBeenCalled();
    });

    it('can be cancelled', () => {
      const component = create();
      component.startReview('a1');
      component.cancelReview();
      expect(component.reviewing).toBeNull();
    });
  });
});
