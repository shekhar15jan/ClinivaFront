import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultationWorkspace } from './pages/consultation-workspace/consultation-workspace';

const routes: Routes = [
  { path: '', component: ConsultationWorkspace }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConsultationsRoutingModule {}
