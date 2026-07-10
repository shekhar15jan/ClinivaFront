import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AuthRoutingModule } from './auth-routing-module';
import { LoginEmail } from './pages/login-email/login-email';
import { LoginOtp } from './pages/login-otp/login-otp';
import { AuthShell } from './pages/auth-shell/auth-shell';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AuthRoutingModule,
    LoginEmail,
    LoginOtp,
    AuthShell,
  ],
})
export class AuthModule {}
