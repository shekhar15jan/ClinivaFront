import { TestBed } from '@angular/core/testing';
import { ReviewList } from './review-list';
import { ReviewService } from '../../../../core/services/review.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { ReviewResponse } from '../../../../core/models/review.model';

describe('ReviewList', () => {
  const mockReview: any = {
    id: 'r1', patientId: 'p1', patientName: 'John', doctorId: 'd1', doctorName: 'Dr. Smith',
    rating: 4, reviewText: 'Good service', isApproved: false, createdAt: '2026-01-01T00:00:00Z',
  };

  const mockPendingResponse: ApiResponse<any[]> = {
    success: true, data: [mockReview], message: '', timestamp: '', requestId: '',
  };
  const mockApprovedResponse: ApiResponse<any[]> = {
    success: true, data: [{ ...mockReview, id: 'r2', isApproved: true }], message: '', timestamp: '', requestId: '',
  };

  function createComponent(overrides?: Partial<any>) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ReviewService,
          useValue: {
            getPending: vi.fn().mockReturnValue(of(mockPendingResponse)),
            getApproved: vi.fn().mockReturnValue(of(mockApprovedResponse)),
            approveReview: vi.fn().mockReturnValue(of({ success: true, data: { ...mockReview, isApproved: true }, message: '', timestamp: '', requestId: '' })),
            rejectReview: vi.fn().mockReturnValue(of({ success: true, message: '', timestamp: '', requestId: '' })),
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
    expect(component.pendingReviews).toEqual([]);
    expect(component.approvedReviews).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
    expect(component.activeTab).toBe('pending');
  });

  it('should load both pending and approved reviews on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.pendingReviews.length).toBe(1);
    expect(component.approvedReviews.length).toBe(1);
    expect(component.isLoading).toBe(false);
  });

  it('should switch tabs', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.activeTab).toBe('pending');
    component.switchTab('approved');
    expect(component.activeTab).toBe('approved');
    component.switchTab('pending');
    expect(component.activeTab).toBe('pending');
  });

  it('should compute reviews based on active tab', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.reviews.length).toBe(1);
    component.activeTab = 'approved';
    expect(component.reviews.length).toBe(1);
    expect(component.reviews[0].id).toBe('r2');
  });

  it('should handle load error', () => {
    const component = createComponent({
      getPending: vi.fn().mockReturnValue(throwError(() => ({ message: 'Load failed' }))),
      getApproved: vi.fn().mockReturnValue(throwError(() => ({ message: 'Load failed' }))),
    });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Load failed');
  });

  it('should approve review and update pending list', () => {
    const component = createComponent();
    component.ngOnInit();
    const pending = component.pendingReviews[0];
    component.approve(pending);
    expect(component.pendingReviews.length).toBe(0);
  });

  it('should reject review and remove from pending list', () => {
    const component = createComponent();
    component.ngOnInit();
    const pending = component.pendingReviews[0];
    component.reject(pending);
    expect(component.pendingReviews.length).toBe(0);
  });

  it('should handle approve error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    const component = createComponent({
      approveReview: vi.fn().mockReturnValue(throwError(() => new Error('fail'))),
    });
    component.ngOnInit();
    component.approve(component.pendingReviews[0]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle reject error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    const component = createComponent({
      rejectReview: vi.fn().mockReturnValue(throwError(() => new Error('fail'))),
    });
    component.ngOnInit();
    component.reject(component.pendingReviews[0]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should open and close detail modal', () => {
    const component = createComponent();
    component.ngOnInit();
    const review = component.pendingReviews[0];
    component.openDetail(review);
    expect(component.selectedReview).toBe(review);
    component.closeDetail();
    expect(component.selectedReview).toBeNull();
  });

  it('should generate star array for rating', () => {
    const component = createComponent();
    expect(component.starArray(4)).toEqual([1, 1, 1, 1, 0]);
    expect(component.starArray(5)).toEqual([1, 1, 1, 1, 1]);
    expect(component.starArray(0)).toEqual([0, 0, 0, 0, 0]);
  });
});