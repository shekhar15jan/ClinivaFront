import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MedicineCatalog } from './pages/medicine-catalog/medicine-catalog';

const routes: Routes = [
  { path: '', component: MedicineCatalog },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MedicinesRoutingModule {}
