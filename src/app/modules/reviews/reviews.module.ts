import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/review-list/review-list').then(m => m.ReviewList)
      }
    ])
  ]
})
export class ReviewsModule {}
