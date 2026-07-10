import { Injectable, signal, inject } from '@angular/core';
import { EffectiveLicenseService } from '../services/effective-license.service';

@Injectable({
  providedIn: 'root',
})
export class LicenseStore {
  private licenseService = inject(EffectiveLicenseService);

  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  get activeModules() {
    return this.licenseService.activeModules;
  }

  get coreModules() {
    return this.licenseService.coreModules;
  }

  get enabledFeatures() {
    return this.licenseService.enabledFeatures;
  }

  get resourceUsage() {
    return this.licenseService.resourceUsage;
  }

  get isTrial() {
    return this.licenseService.isTrial;
  }

  get currentLicense() {
    return this.licenseService.currentLicense;
  }

  loadLicense(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.licenseService.loadLicense().subscribe({
      next: () => this.loadingSignal.set(false),
      error: (err) => {
        this.loadingSignal.set(false);
        this.errorSignal.set(err.message || 'Failed to load license');
      },
    });
  }

  isModuleAccessible(moduleCode: string): boolean {
    return this.licenseService.isModuleAccessible(moduleCode);
  }

  isFeatureEnabled(featureCode: string): boolean {
    return this.licenseService.isFeatureEnabled(featureCode);
  }

  canCreateResource(resourceCode: string): boolean {
    return this.licenseService.canCreateResource(resourceCode);
  }
}
