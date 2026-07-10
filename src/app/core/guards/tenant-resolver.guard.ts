import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TenantService } from '../services/tenant.service';
import { TenantContextService } from '../services/tenant-context.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class TenantResolverGuard implements CanActivate {
  private tenantService = inject(TenantService);
  private tenantContext = inject(TenantContextService);
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Promise<boolean> {
    const hospitalCode = route.params['hospitalCode'];

    if (!hospitalCode) {
      this.router.navigate(['/login']);
      return Promise.resolve(false);
    }

    if (this.tenantContext.tenantCode() === hospitalCode && this.tenantContext.tenant()) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      this.tenantService.resolveByCode(hospitalCode).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.authService.setTenantResolution(response.data);
            resolve(true);
          } else {
            this.router.navigate(['/login']);
            resolve(false);
          }
        },
        error: () => {
          this.router.navigate(['/login']);
          resolve(false);
        },
      });
    });
  }
}
