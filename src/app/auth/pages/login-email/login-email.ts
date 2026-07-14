import { Component, OnInit, inject } from '@angular/core';
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
  isLoading = false;
  errorMessage = '';
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
  }

  sendOtp(): void {
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

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
          this.isLoading = false;
        },
      });
  }
}
