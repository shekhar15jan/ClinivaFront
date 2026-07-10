import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { EffectiveLicenseService } from '../services/effective-license.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ModuleGuard implements CanActivate {
  private licenseService = inject(EffectiveLicenseService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const moduleCode = route.data['moduleCode'] as string;
    if (!moduleCode) return true;

    if (this.licenseService.isModuleAccessible(moduleCode)) {
      return true;
    }

    const hospitalCode = route.params['hospitalCode'] || route.parent?.params['hospitalCode'];
    this.router.navigate([`/${hospitalCode}/dashboard`]);
    this.toastService.warning('This module is not available in your current plan.');
    return false;
  }
}
