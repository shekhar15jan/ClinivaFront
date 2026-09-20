import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/user-list/user-list').then(m => m.UserListComponent)
      }
    ])
  ]
})
export class UsersModule {}
