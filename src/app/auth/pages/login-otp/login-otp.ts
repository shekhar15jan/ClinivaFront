import { Component, OnInit, inject, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-otp',
  templateUrl: './login-otp.html',
  styleUrl: './login-otp.scss',
  imports: [FormsModule],
})
export class LoginOtp implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits: string[] = ['', '', '', '', '', ''];
  isLoading = false;
  errorMessage = '';
  email = '';
  hospitalCode = '';

  ngOnInit(): void {
    this.email = this.authService.pendingEmail || '';
    this.hospitalCode = this.route.parent?.snapshot.params['hospitalCode'] || '';

    if (!this.email || !this.hospitalCode) {
      this.router.navigate([`/${this.hospitalCode || ''}/login`]);
    }
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 5) {
      this.otpInputs.toArray()[index + 1]?.nativeElement.focus();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.otpInputs.toArray()[index - 1]?.nativeElement.focus();
    }
  }

  get otpCode(): string {
    return this.digits.join('');
  }

  verifyOtp(): void {
    if (this.otpCode.length !== 6) {
      this.errorMessage = 'Please enter the complete 6-digit OTP.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .verifyOtp({
        email: this.email,
        otp: this.otpCode,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.router.navigate([`/${this.hospitalCode}/dashboard`]);
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Invalid OTP. Please try again.';
          this.isLoading = false;
        },
      });
  }

  resendOtp(): void {
    if (this.email && this.hospitalCode) {
      this.authService.sendOtp({ email: this.email }).subscribe();
    }
  }

  goBack(): void {
    this.authService.loginStep.set('credentials');
    this.router.navigate([`/${this.hospitalCode}/login`]);
  }
}
