import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrescriptionList } from './pages/prescription-list/prescription-list';
import { PrescriptionDetail } from './pages/prescription-detail/prescription-detail';

const routes: Routes = [
  { path: '', component: PrescriptionList },
  { path: ':id', component: PrescriptionDetail },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrescriptionsRoutingModule {}
