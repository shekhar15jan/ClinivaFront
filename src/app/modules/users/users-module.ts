import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/user-list/user-list').then(m => m.UserListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./pages/user-form/user-form').then(m => m.UserFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/user-form/user-form').then(m => m.UserFormComponent)
      }
    ])
  ]
})
export class UsersModule {}
