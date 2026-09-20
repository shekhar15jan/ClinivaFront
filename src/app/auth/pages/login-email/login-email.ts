import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TenantContextService } from '../../../core/services/tenant-context.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-email',
  templateUrl: './login-email.html',
  styleUrl: './login-email.scss',
  imports: [FormsModule],
})
export class LoginEmail implements OnInit {
  private authService = inject(AuthService);
  private tenantContext = inject(TenantContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  // Backed by a signal: the app is zoneless, so a plain field changed in an HTTP callback never re-renders.
  private readonly _isLoading = signal<boolean>(false);
  get isLoading(): boolean { return this._isLoading(); }
  set isLoading(value: boolean) { this._isLoading.set(value); }

  // Backed by a signal: the app is zoneless, so a plain field changed in an HTTP callback never re-renders.
  private readonly _errorMessage = signal<string>('');
  get errorMessage(): string { return this._errorMessage(); }
  set errorMessage(value: string) { this._errorMessage.set(value); }

  // Backed by a signal: the app is zoneless, so a plain field changed in an HTTP callback never re-renders.
  private readonly _passwordChangeRequired = signal<boolean>(false);
  get passwordChangeRequired(): boolean { return this._passwordChangeRequired(); }
  set passwordChangeRequired(value: boolean) { this._passwordChangeRequired.set(value); }

  // Backed by a signal: the app is zoneless, so a plain field changed in an HTTP callback never re-renders.
  private readonly _passwordChanged = signal<boolean>(false);
  get passwordChanged(): boolean { return this._passwordChanged(); }
  set passwordChanged(value: boolean) { this._passwordChanged.set(value); }
  hospitalCode = '';

  ngOnInit(): void {
    this.hospitalCode = this.route.parent?.snapshot.params['hospitalCode'] || this.route.snapshot.params['hospitalCode'] || '';
    if (!this.hospitalCode) {
      this.router.navigate(['/login']);
      return;
    }
    const tenant = this.tenantContext.tenant();
    if (!tenant) {
      this.router.navigate([`/${this.hospitalCode}/login`]);
      return;
    }
    if (this.authService.pendingEmail) {
      this.email = this.authService.pendingEmail;
    }
    this.passwordChanged = this.route.snapshot?.queryParams?.['passwordChanged'] === '1';
  }

  goToChangePassword(): void {
    this.authService.pendingEmail = this.email || this.authService.pendingEmail;
    this.router.navigate([`/${this.hospitalCode}/change-password`]);
  }

  sendOtp(): void {
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.passwordChangeRequired = false;

    this.authService
      .sendOtp({ email: this.email })
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.authService.pendingEmail = this.email;
          this.authService.pendingTenantCode = this.hospitalCode;
          this.authService.loginStep.set('otp');
          this.router.navigate([`/${this.hospitalCode}/otp`]);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to send OTP. Please try again.';
          this.passwordChangeRequired = /password change required/i.test(this.errorMessage);
          this.isLoading = false;
        },
      });
  }
}
