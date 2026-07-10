import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MedicinesRoutingModule } from './medicines-routing-module';
import { MedicineCatalog } from './pages/medicine-catalog/medicine-catalog';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MedicinesRoutingModule,
    MedicineCatalog,
  ],
})
export class MedicinesModule {}
