import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        loadComponent: () => import('./pages/contact-list/contact-list').then(m => m.ContactList)
      }
    ])
  ]
})
export class ContactsModule {}
