import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillList } from './pages/bill-list/bill-list';
import { InvoiceDetail } from './pages/invoice-detail/invoice-detail';

const routes: Routes = [
  { path: '', component: BillList },
  { path: ':id', component: InvoiceDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillingRoutingModule {}
