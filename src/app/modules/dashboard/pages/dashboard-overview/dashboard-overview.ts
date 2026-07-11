import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { LayoutStore } from '../../../../core/store/layout.store';

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.scss',
})
export class DashboardOverview implements OnInit, OnDestroy {
  private layoutStore = inject(LayoutStore);

  ngOnInit(): void {
    this.layoutStore.setFabConfig({
      icon: 'add',
      label: 'New Appointment',
      route: 'appointments/book',
    });
  }

  ngOnDestroy(): void {
    this.layoutStore.setFabConfig(null);
  }
}
