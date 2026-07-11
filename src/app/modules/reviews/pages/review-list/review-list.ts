import { Component, OnInit, inject } from '@angular/core';
import { ReviewService } from '../../../../core/services/review.service';
import { ReviewResponse } from '../../../../core/models/review.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss',
  standalone: true,
  imports: [EmptyStateComponent, DatePipe],
})
export class ReviewList implements OnInit {
  private reviewService = inject(ReviewService);

  reviews: ReviewResponse[] = [];
  isLoading = false;
  error = '';

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.isLoading = true;
    this.error = '';
    this.reviewService.getPending().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.reviews = res.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load reviews';
        this.isLoading = false;
      },
    });
  }

  approve(review: ReviewResponse) {
    this.reviewService.approveReview(review.id).subscribe({
      next: () => this.loadReviews(),
      error: (err) => console.error('Failed to approve review:', err),
    });
  }

  reject(review: ReviewResponse) {
    this.reviewService.rejectReview(review.id).subscribe({
      next: () => this.loadReviews(),
      error: (err) => console.error('Failed to reject review:', err),
    });
  }
}
