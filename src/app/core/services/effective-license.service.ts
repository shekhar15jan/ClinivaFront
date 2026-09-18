import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import {
  EffectiveLicense,
  EffectiveModule,
  ResourceConstraint,
} from '../models/effective-license.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EffectiveLicenseService {
  private http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;
  private license = signal<EffectiveLicense | null>(null);

  readonly activeModules = computed(
    () =>
      this.license()
        ?.effectiveModules.filter((m) => m.status === 'ACTIVE' || m.status === 'TRIAL')
        .map((m) => m.moduleCode) ?? [],
  );

  readonly coreModules = computed(
    () =>
      this.license()
        ?.effectiveModules.filter((m) => m.isCore)
        .map((m) => m.moduleCode) ?? [],
  );

  readonly enabledFeatures = computed(
    () =>
      this.license()
        ?.effectiveFeatures.filter((f) => f.isEnabled)
        .map((f) => f.featureCode) ?? [],
  );

  readonly resourceUsage = computed(() => this.license()?.effectiveConstraints ?? []);

  readonly isTrial = computed(() => this.license()?.status === 'TRIAL');

  readonly trialEndsAt = computed(() => this.license()?.trialEndsAt ?? null);

  readonly planName = computed(() => this.license()?.planName ?? '');

  readonly subscriptionStatus = computed(() => this.license()?.status ?? null);

  readonly currentLicense = this.license.asReadonly();

  isModuleAccessible(moduleCode: string): boolean {
    const modules = this.license()?.effectiveModules ?? [];
    const mod = modules.find((m) => m.moduleCode === moduleCode);
    if (!mod) return false;
    if (mod.isCore) return true;
    return mod.status === 'ACTIVE' || mod.status === 'TRIAL';
  }

  isFeatureEnabled(featureCode: string): boolean {
    return this.enabledFeatures().includes(featureCode);
  }

  canCreateResource(resourceCode: string): boolean {
    const constraint = this.license()?.effectiveConstraints.find(
      (c) => c.resourceCode === resourceCode,
    );
    if (!constraint) return true;
    if (constraint.isUnlimited || constraint.limit === 0) return true;
    return constraint.currentUsage < constraint.limit;
  }

  getResourceUsage(
    resourceCode: string,
  ): { current: number; limit: number; isUnlimited: boolean } | null {
    const constraint = this.license()?.effectiveConstraints.find(
      (c) => c.resourceCode === resourceCode,
    );
    if (!constraint) return null;
    return {
      current: constraint.currentUsage,
      limit: constraint.limit,
      isUnlimited: constraint.isUnlimited,
    };
  }

  getModuleInfo(moduleCode: string): EffectiveModule | undefined {
    return this.license()?.effectiveModules.find((m) => m.moduleCode === moduleCode);
  }

  loadLicense(): Observable<EffectiveLicense> {
    return this.http
      .get<ApiResponse<EffectiveLicense>>(`${this.apiUrl}/hms/license/effective`)
      .pipe(
        map((res) => res.data),
        tap((license) => this.license.set(license)),
      );
  }

  refreshUsage(resourceCode: string): Observable<ResourceConstraint> {
    return this.http
      .get<ApiResponse<ResourceConstraint>>(
        `${this.apiUrl}/hms/license/usage/${resourceCode}`,
      )
      .pipe(
        map((res) => res.data),
        tap((updated) => {
          const current = this.license();
          if (current) {
            const idx = current.effectiveConstraints.findIndex(
              (c) => c.resourceCode === resourceCode,
            );
            if (idx >= 0) {
              const constraints = [...current.effectiveConstraints];
              constraints[idx] = updated;
              this.license.set({ ...current, effectiveConstraints: constraints });
            }
          }
        }),
      );
  }

  setLicenseFromTenantContext(
    modules: {
      moduleCode: string;
      moduleName: string;
      status: string;
      isCore: boolean;
      source: string;
    }[],
    subscription: {
      planName: string;
      status: string;
      endDate: string;
      maxDoctors?: number;
      maxPatients?: number;
    },
  ): void {
    const effectiveModules: EffectiveModule[] = modules.map((m) => ({
      moduleCode: m.moduleCode,
      moduleName: m.moduleName,
      isCore: m.isCore,
      source: (m.isCore
        ? 'CORE'
        : m.source === 'ADDON'
          ? 'ADDON'
          : 'PLAN') as EffectiveModule['source'],
      status: m.status as EffectiveModule['status'],
    }));

    const constraints: ResourceConstraint[] = [];
    if (subscription.maxDoctors !== undefined && subscription.maxDoctors > 0) {
      constraints.push({
        resourceCode: 'DOCTOR',
        resourceName: 'Doctors',
        limit: subscription.maxDoctors,
        currentUsage: 0,
        isUnlimited: false,
      });
    }
    if (subscription.maxPatients !== undefined && subscription.maxPatients > 0) {
      constraints.push({
        resourceCode: 'PATIENT',
        resourceName: 'Patients',
        limit: subscription.maxPatients,
        currentUsage: 0,
        isUnlimited: false,
      });
    }

    const effectiveLicense: EffectiveLicense = {
      tenantId: '',
      planName: subscription.planName,
      planCode: '',
      status: subscription.status as EffectiveLicense['status'],
      effectiveProducts: [],
      effectiveModules,
      effectiveConstraints: constraints,
      effectiveFeatures: [],
      purchasedAddons: [],
      trialEndsAt: null,
      subscriptionEndsAt: subscription.endDate,
    };

    this.license.set(effectiveLicense);
  }

  clear(): void {
    this.license.set(null);
  }
}
