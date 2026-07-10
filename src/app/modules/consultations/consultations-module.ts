import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ConsultationsRoutingModule } from './consultations-routing-module';
import { ConsultationWorkspace } from './pages/consultation-workspace/consultation-workspace';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, ConsultationsRoutingModule, ConsultationWorkspace],
})
export class ConsultationsModule {}
