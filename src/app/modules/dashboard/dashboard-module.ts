import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing-module';
import { DashboardOverview } from './pages/dashboard-overview/dashboard-overview';

@NgModule({
  imports: [CommonModule, DashboardRoutingModule, DashboardOverview],
})
export class DashboardModule {}
