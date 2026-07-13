import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { OnboardingService } from '../services/onboarding.service';

@Injectable({
  providedIn: 'root',
})
export class OnboardingGuard implements CanActivate {
  private onboardingService = inject(OnboardingService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const hospitalCode = route.params['hospitalCode'];

    return new Promise((resolve) => {
      this.onboardingService.getStatus().subscribe({
        next: (response) => {
          if (response.success && response.data && !response.data.completed) {
            this.router.navigate([`/${hospitalCode}/onboarding`]);
            resolve(false);
          } else {
            resolve(true);
          }
        },
        error: () => resolve(true),
      });
    });
  }
}
