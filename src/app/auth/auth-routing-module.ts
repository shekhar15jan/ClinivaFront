import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthShell } from './pages/auth-shell/auth-shell';
import { LoginEmail } from './pages/login-email/login-email';
import { LoginOtp } from './pages/login-otp/login-otp';

const routes: Routes = [
  {
    path: '',
    component: AuthShell,
    children: [
      { path: 'login', component: LoginEmail },
      { path: 'otp', component: LoginOtp },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
