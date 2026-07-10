import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { BillingRoutingModule } from './billing-routing-module';
import { InvoiceDetail } from './pages/invoice-detail/invoice-detail';
import { PaymentModal } from './pages/payment-modal/payment-modal';
import { BillList } from './pages/bill-list/bill-list';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BillingRoutingModule,
    InvoiceDetail,
    PaymentModal,
    BillList,
  ],
})
export class BillingModule {}
