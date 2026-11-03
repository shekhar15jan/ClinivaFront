import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

/** Patient self-registration in two tap-friendly steps: details + email, then the emailed code. */
@Component({
  selector: 'app-register-patient',
  templateUrl: './register-patient.html',
  imports: [FormsModule],
})
export class RegisterPatient implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  hospitalCode = '';
  fullName = '';
  email = '';
  phone = '';
  gender = '';
  dateOfBirth = '';
  acceptPrivacyNotice = false;
  otp = '';

  readonly step = signal<1 | 2>(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly done = signal(false);

  ngOnInit(): void {
    this.hospitalCode = this.route.parent?.snapshot.params['hospitalCode'] || this.route.snapshot.params['hospitalCode'] || '';
    if (!this.hospitalCode) {
      this.router.navigate(['/login']);
    }
  }

  /** Returns the first problem with the details, or an empty string. */
  detailsProblem(): string {
    if (!this.fullName.trim()) return 'Please enter your full name.';
    if (!this.email.includes('@')) return 'Please enter a valid email address.';
    if (!/^[+]?[0-9 -]{8,17}$/.test(this.phone.trim())) return 'Please enter a valid mobile number.';
    if (!this.gender) return 'Please choose your gender.';
    if (!this.acceptPrivacyNotice) return 'Please read and accept the privacy notice to continue.';
    return '';
  }

  sendCode(): void {
    const problem = this.detailsProblem();
    if (problem) {
      this.error.set(problem);
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.sendRegistrationCode({ email: this.email.trim(), tenantCode: this.hospitalCode }).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set(2);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'We could not send the code. Please try again in a minute.');
      },
    });
  }

  createAccount(): void {
    if (!this.otp.trim()) {
      this.error.set('Please enter the code we emailed you.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService
      .register({
        email: this.email.trim(),
        fullName: this.fullName.trim(),
        phone: this.phone.trim(),
        gender: this.gender || undefined,
        dateOfBirth: this.dateOfBirth || undefined,
        tenantCode: this.hospitalCode,
        role: 'PATIENT',
        acceptPrivacyNotice: this.acceptPrivacyNotice,
        otp: this.otp.trim(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.done.set(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || 'The code did not work. Check it and try again, or ask for a new code.');
        },
      });
  }

  back(): void {
    this.error.set('');
    this.otp = '';
    this.step.set(1);
  }

  goToLogin(): void {
    this.authService.pendingEmail = this.email;
    this.router.navigate([`/${this.hospitalCode}/login`]);
  }
}
