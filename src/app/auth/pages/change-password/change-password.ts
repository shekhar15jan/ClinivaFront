import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

export const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.html',
  imports: [FormsModule],
})
export class ChangePassword implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly minLength = MIN_PASSWORD_LENGTH;
  email = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  // Backed by a signal: the app is zoneless, so a plain field changed in an HTTP callback never re-renders.
  private readonly _isLoading = signal<boolean>(false);
  get isLoading(): boolean { return this._isLoading(); }
  set isLoading(value: boolean) { this._isLoading.set(value); }

  // Backed by a signal: the app is zoneless, so a plain field changed in an HTTP callback never re-renders.
  private readonly _errorMessage = signal<string>('');
  get errorMessage(): string { return this._errorMessage(); }
  set errorMessage(value: string) { this._errorMessage.set(value); }
  hospitalCode = '';

  ngOnInit(): void {
    this.hospitalCode =
      this.route.parent?.snapshot.params['hospitalCode'] || this.route.snapshot.params['hospitalCode'] || '';
    this.email = this.authService.pendingEmail ?? '';
  }

  /** First problem with the form, or '' when it can be submitted. */
  validate(): string {
    if (!this.email || !this.email.includes('@')) return 'Please enter a valid email address.';
    if (!this.currentPassword) return 'Enter your current or temporary password.';
    if (this.newPassword.length < this.minLength) {
      return `The new password must be at least ${this.minLength} characters.`;
    }
    if (this.newPassword === this.currentPassword) return 'The new password must be different from the current one.';
    if (this.newPassword !== this.confirmPassword) return 'The new passwords do not match.';
    return '';
  }

  submit(): void {
    this.errorMessage = this.validate();
    if (this.errorMessage) return;

    this.isLoading = true;
    this.authService.changePassword(this.email, this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.authService.pendingEmail = this.email;
        this.router.navigate([`/${this.hospitalCode}/login`], { queryParams: { passwordChanged: '1' } });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Could not change the password. Please try again.';
      },
    });
  }

  backToLogin(): void {
    this.router.navigate([`/${this.hospitalCode}/login`]);
  }
}
