import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ReportsRoutingModule } from './reports-routing-module';
import { ReportsDashboard } from './pages/reports-dashboard/reports-dashboard';

@NgModule({
  imports: [CommonModule, FormsModule, ReportsRoutingModule, ReportsDashboard],
})
export class ReportsModule {}
