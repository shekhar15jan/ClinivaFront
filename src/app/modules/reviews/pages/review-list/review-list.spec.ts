import { TestBed } from '@angular/core/testing';
import { ReviewList } from './review-list';
import { ReviewService } from '../../../../core/services/review.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { ReviewResponse } from '../../../../core/models/review.model';

describe('ReviewList', () => {
  const mockReview: ReviewResponse = {
    id: 'r1', patientId: 'p1', patientName: 'John', doctorId: 'd1', doctorName: 'Dr. Smith',
    rating: 4, reviewText: 'Good service', isApproved: false, createdAt: '2026-01-01T00:00:00Z',
  };

  const mockPendingResponse: ApiResponse<ReviewResponse[]> = {
    success: true, data: [mockReview], message: '', timestamp: '', requestId: '',
  };

  const mockApproveResponse: ApiResponse<ReviewResponse> = {
    success: true, data: { ...mockReview, isApproved: true }, message: '', timestamp: '', requestId: '',
  };

  function createComponent(overrides?: Partial<ReviewService>) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ReviewService,
          useValue: {
            getPending: vi.fn().mockReturnValue(of(mockPendingResponse)),
            approveReview: vi.fn().mockReturnValue(of(mockApproveResponse)),
            rejectReview: vi.fn().mockReturnValue(of({ success: true, data: undefined, message: '', timestamp: '', requestId: '' })),
            ...overrides,
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new ReviewList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.reviews).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
  });

  it('should load pending reviews on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.reviews.length).toBe(1);
    expect(component.reviews[0].patientName).toBe('John');
    expect(component.isLoading).toBe(false);
  });

  it('should handle load error', () => {
    const component = createComponent({
      getPending: vi.fn().mockReturnValue(throwError(() => ({ message: 'Load failed' }))),
    });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Load failed');
  });

  it('should handle load error without message', () => {
    const component = createComponent({
      getPending: vi.fn().mockReturnValue(throwError(() => ({}))),
    });
    component.ngOnInit();
    expect(component.error).toBe('Failed to load reviews');
  });

  it('should approve review and reload', () => {
    const getPendingSpy = vi.fn().mockReturnValue(of(mockPendingResponse));
    const component = createComponent({ getPending: getPendingSpy });

    component.approve(mockReview);

    expect(getPendingSpy).toHaveBeenCalled();
  });

  it('should handle approve error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    const component = createComponent({
      approveReview: vi.fn().mockReturnValue(throwError(() => new Error('fail'))),
    });

    component.approve(mockReview);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should reject review and reload', () => {
    const getPendingSpy = vi.fn().mockReturnValue(of(mockPendingResponse));
    const component = createComponent({ getPending: getPendingSpy });

    component.reject(mockReview);

    expect(getPendingSpy).toHaveBeenCalled();
  });

  it('should handle reject error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    const component = createComponent({
      rejectReview: vi.fn().mockReturnValue(throwError(() => new Error('fail'))),
    });

    component.reject(mockReview);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
