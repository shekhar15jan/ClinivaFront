import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { GenericLogin } from './pages/generic-login/generic-login';
import { AuthShell } from './pages/auth-shell/auth-shell';

const routes: Routes = [
  {
    path: '',
    component: AuthShell,
    children: [
      { path: '', component: GenericLogin }
    ]
  }
];

@NgModule({
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes), GenericLogin, AuthShell],
})
export class GenericLoginModule {}
