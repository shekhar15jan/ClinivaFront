import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

/**
 * "Not registered? Ask for access": a small form for someone who has no account. It never says whether an account exists;
 * the same thank-you shows after any accepted request. Our server passes the request on to the platform.
 */
@Component({
  selector: 'app-request-access',
  templateUrl: './request-access.html',
  imports: [FormsModule],
})
export class RequestAccess implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  hospitalCode = '';
  contact = '';
  name = '';
  consent = false;
  /** Trap field for robots: people never see or fill it. */
  website = '';

  readonly loading = signal(false);
  readonly error = signal('');
  readonly sent = signal(false);

  ngOnInit(): void {
    this.hospitalCode = this.route.parent?.snapshot.params['hospitalCode'] || this.route.snapshot.params['hospitalCode'] || '';
    this.contact = this.authService.pendingEmail || '';
  }

  submit(): void {
    const contact = this.contact.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(contact) && !/^[+]?[0-9 -]{8,17}$/.test(contact)) {
      this.error.set('Please enter an email address or a mobile number.');
      return;
    }
    if (!this.consent) {
      this.error.set('Please tick the box so we may contact you.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.authService.requestAccess({ contact, name: this.name.trim() || undefined, consent: true, website: this.website }).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.status === 429
          ? 'Too many requests from this device. Please try again a little later.'
          : err?.error?.message || 'We could not send your request. Please try again.');
      },
    });
  }

  goToLogin(): void {
    this.router.navigate([`/${this.hospitalCode}/login`]);
  }
}
