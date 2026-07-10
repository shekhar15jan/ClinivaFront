import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/payment-list/payment-list').then(m => m.PaymentList)
      }
    ])
  ]
})
export class PaymentsModule {}
