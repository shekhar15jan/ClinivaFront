import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/package-list/package-list').then(m => m.PackageList)
      }
    ])
  ]
})
export class HealthPackagesModule {}
