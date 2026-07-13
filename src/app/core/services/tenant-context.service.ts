import { Injectable, signal, computed, inject } from '@angular/core';
import { Tenant, TenantModule, Subscription } from '../models/tenant.model';
import { EffectiveLicenseService } from './effective-license.service';

@Injectable({
  providedIn: 'root',
})
export class TenantContextService {
  private licenseService = inject(EffectiveLicenseService);

  private currentTenant = signal<Tenant | null>(null);
  private currentModules = signal<TenantModule[]>([]);
  private currentSubscription = signal<Subscription | null>(null);

  readonly tenant = this.currentTenant.asReadonly();
  readonly modules = this.currentModules.asReadonly();
  readonly subscription = this.currentSubscription.asReadonly();

  readonly tenantCode = computed(() => this.currentTenant()?.tenantId ?? null);
  readonly tenantName = computed(() => this.currentTenant()?.name ?? 'Cliniva HMS');
  readonly isTrial = computed(() => this.currentTenant()?.status === 'TRIAL');
  readonly isActive = computed(() => {
    const status = this.currentTenant()?.status;
    return status === 'ACTIVE' || status === 'TRIAL';
  });

  readonly activeModuleCodes = computed(() =>
    this.currentModules()
      .filter((m) => m.status === 'ACTIVE' || m.status === 'TRIAL')
      .map((m) => m.moduleCode),
  );

  setTenantContext(tenant: Tenant, modules: TenantModule[], subscription: Subscription): void {
    this.currentTenant.set(tenant);
    this.currentModules.set(modules);
    this.currentSubscription.set(subscription);

    this.licenseService.setLicenseFromTenantContext(
      modules.map((m) => ({
        moduleCode: m.moduleCode,
        moduleName: m.moduleName,
        status: m.status,
        isCore: m.isCore,
        source: m.source || '',
      })),
      {
        planName: subscription.planName,
        status: subscription.status,
        endDate: subscription.endDate || '',
        maxDoctors: subscription.maxDoctors,
        maxPatients: subscription.maxPatients,
      },
    );
  }

  hasModule(moduleCode: string): boolean {
    return this.licenseService.isModuleAccessible(moduleCode);
  }

  isModuleActive(moduleCode: string): boolean {
    return this.licenseService.isModuleAccessible(moduleCode);
  }

  getModuleStatus(moduleCode: string): TenantModule | undefined {
    return this.currentModules().find((m) => m.moduleCode === moduleCode);
  }

  clear(): void {
    this.currentTenant.set(null);
    this.currentModules.set([]);
    this.currentSubscription.set(null);
    this.licenseService.clear();
  }

  getMaxDoctors(): number {
    const usage = this.licenseService.getResourceUsage('DOCTOR');
    return usage?.limit ?? this.currentSubscription()?.maxDoctors ?? 1;
  }

  getMaxPatients(): number {
    const usage = this.licenseService.getResourceUsage('PATIENT');
    return usage?.limit ?? this.currentSubscription()?.maxPatients ?? 100;
  }
}
