import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { TenantResolution } from '../../../core/models/tenant.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generic-login',
  templateUrl: './generic-login.html',
  styleUrl: './generic-login.scss',
  imports: [FormsModule],
})
export class GenericLogin {
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  email = '';
  isLoading = false;
  errorMessage = '';
  resolutions: TenantResolution[] = [];
  showSelection = false;

  resolveTenant(): void {
    if (!this.email || !this.email.includes('@')) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.resolutions = [];

    this.tenantService.resolveByEmail(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.resolutions = response.data;

          if (this.resolutions.length === 1) {
            const resolution = this.resolutions[0];
            this.authService.setTenantResolution(resolution);
            this.authService.pendingEmail = this.email;
            this.router.navigate([`/${resolution.tenant.tenantId}/login`]);
          } else if (this.resolutions.length > 1) {
            this.showSelection = true;
          } else {
            this.errorMessage = 'No account found with this email address.';
          }
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to resolve tenant. Please try again.';
        this.isLoading = false;
      },
    });
  }

  selectTenant(resolution: TenantResolution): void {
    this.authService.setTenantResolution(resolution);
    this.authService.pendingEmail = this.email;
    this.router.navigate([`/${resolution.tenant.tenantId}/login`]);
  }

  goToHospitalCode(): void {
    this.router.navigate(['/login']);
  }
}
