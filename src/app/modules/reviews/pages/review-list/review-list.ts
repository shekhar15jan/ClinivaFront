import { Component, OnInit, inject } from '@angular/core';
import { ReviewService } from '../../../../core/services/review.service';
import { ReviewResponse } from '../../../../core/models/review.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss',
  standalone: true,
  imports: [EmptyStateComponent, DatePipe],
})
export class ReviewList implements OnInit {
  private reviewService = inject(ReviewService);
  private toast = inject(ToastService);

  activeTab: 'pending' | 'approved' = 'pending';
  pendingReviews: ReviewResponse[] = [];
  approvedReviews: ReviewResponse[] = [];
  isLoading = false;
  error = '';
  selectedReview: ReviewResponse | null = null;

  get reviews(): ReviewResponse[] {
    return this.activeTab === 'pending' ? this.pendingReviews : this.approvedReviews;
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;
    this.error = '';
    this.reviewService.getPending().subscribe({
      next: (res) => {
        this.pendingReviews = res.data ?? [];
        this.reviewService.getApproved().subscribe({
          next: (res2) => {
            this.approvedReviews = res2.data ?? [];
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load reviews';
        this.isLoading = false;
      },
    });
  }

  switchTab(tab: 'pending' | 'approved'): void {
    this.activeTab = tab;
  }

  openDetail(review: ReviewResponse): void {
    this.selectedReview = review;
  }

  closeDetail(): void {
    this.selectedReview = null;
  }

  approve(review: ReviewResponse): void {
    this.reviewService.approveReview(review.id).subscribe({
      next: () => {
        const approved = { ...review, isApproved: true };
        this.pendingReviews = this.pendingReviews.filter((r) => r.id !== review.id);
        // It moves to Approved straight away; before, the Approved tab and its count stayed as they were until a reload.
        this.approvedReviews = [approved, ...this.approvedReviews.filter((r) => r.id !== review.id)];
        if (this.selectedReview?.id === review.id) {
          this.selectedReview = approved;
        }
        this.toast.success('Review approved');
      },
      error: (err) => this.toast.error(err?.error?.message || 'The review could not be approved.'),
    });
  }

  reject(review: ReviewResponse): void {
    this.reviewService.rejectReview(review.id).subscribe({
      next: () => {
        this.pendingReviews = this.pendingReviews.filter((r) => r.id !== review.id);
        if (this.selectedReview?.id === review.id) {
          this.closeDetail();
        }
        this.toast.success('Review rejected');
      },
      error: (err) => this.toast.error(err?.error?.message || 'The review could not be rejected.'),
    });
  }

  starArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
}
