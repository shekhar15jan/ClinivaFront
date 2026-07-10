import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles: string[] = route.data['roles'];
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const user = this.authService.currentUserValue;
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      const hospitalCode = route.params['hospitalCode'] || route.parent?.params['hospitalCode'];
      this.router.navigate([`/${hospitalCode}/dashboard`]);
      return false;
    }
    return true;
  }
}
