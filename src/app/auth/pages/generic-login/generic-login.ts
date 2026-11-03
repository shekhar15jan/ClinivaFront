import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';
import { TenantService } from '../../../core/services/tenant.service';
import { TenantResolution } from '../../../core/models/tenant.model';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { homePathFor } from '../../../core/utils/route.util';

@Component({
  selector: 'app-generic-login',
  templateUrl: './generic-login.html',
  styleUrl: './generic-login.scss',
  imports: [FormsModule],
})
export class GenericLogin implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  isLoading = false;
  errorMessage = '';
  resolutions: TenantResolution[] = [];
  showSelection = false;
  /** Set when the person was signed out for being idle (the idle sign-out leaves a note; the address may also say so). */
  signedOutIdle = false;
  
  private authSubscription!: Subscription;

  ngOnInit(): void {
    try {
      // Kept until the person starts signing in: this page can be created more than once during the redirect.
      this.signedOutIdle = sessionStorage.getItem('cliniva.signedOutIdle') === '1';
    } catch {
      // Storage blocked: only the address can tell.
    }
    this.signedOutIdle = this.signedOutIdle || this.route.snapshot?.queryParams?.['reason'] === 'idle';
    this.authSubscription = this.authService.authState$.subscribe({
      next: (state: { isAuthenticated: boolean; user: User | null; tenant?: { code?: string } | null }) => {
        if (state.isAuthenticated && state.user) {
          this.redirectBasedOnRole(state.user, state.tenant?.code);
        }
      },
      error: (error) => {
        console.error('Auth state error:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  private redirectBasedOnRole(user: User, hospitalCode?: string): void {
    const queryParams = this.route.snapshot.queryParams;
    const returnUrl = queryParams["returnUrl"];
    // Only a path inside this app: never another site ("//evil.example", "https://...") or a script URL.
    if (typeof returnUrl === 'string' && /^\/(?![/\\])/.test(returnUrl)) {
      this.router.navigateByUrl(returnUrl);
      return;
    }
    // Every screen lives under the clinic code. A bare "/dashboard" was read as a clinic called
    // "dashboard" and sent an already signed-in user straight back to the login page.
    if (!hospitalCode) return;
    this.router.navigate([homePathFor(user.role, hospitalCode)]);
  }

  resolveTenant(): void {
    try {
      sessionStorage.removeItem('cliniva.signedOutIdle');
    } catch {
      // Storage blocked: nothing to clear.
    }
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.resolutions = [];
    this.cdr.markForCheck();

    this.tenantService.resolveByEmail(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.resolutions = response.data;

          if (this.resolutions.length === 1) {
            const resolution = this.resolutions[0];
            this.authService.setTenantResolution(resolution);
            this.authService.pendingEmail = this.email;
            this.router.navigate([`/${resolution.tenant.code || resolution.tenant.tenantId}/login`]);
            return;
          } else if (this.resolutions.length > 1) {
            this.showSelection = true;
          } else {
            this.errorMessage = 'No account found with this email address.';
          }
        } else {
          this.errorMessage = 'No account found with this email address.';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to resolve tenant. Please try again.';
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectTenant(resolution: TenantResolution): void {
    this.authService.setTenantResolution(resolution);
    this.authService.pendingEmail = this.email;
    this.router.navigate([`/${resolution.tenant.code || resolution.tenant.tenantId}/login`]);
  }

  goToHospitalCode(): void {
    this.router.navigate(['/login']);
  }
}
