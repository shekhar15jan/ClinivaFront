import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PrescriptionsRoutingModule } from './prescriptions-routing-module';
import { PrescriptionList } from './pages/prescription-list/prescription-list';
import { PrescriptionDetail } from './pages/prescription-detail/prescription-detail';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PrescriptionsRoutingModule,
    PrescriptionList,
    PrescriptionDetail,
  ],
})
export class PrescriptionsModule {}
