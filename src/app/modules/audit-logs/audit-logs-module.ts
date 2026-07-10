import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/audit-log-viewer/audit-log-viewer').then(m => m.AuditLogViewerComponent)
      }
    ])
  ]
})
export class AuditLogsModule {}
