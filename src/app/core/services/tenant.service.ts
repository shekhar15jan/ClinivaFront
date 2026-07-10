import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { TenantModule, TenantResolution, Subscription, OnboardingStatus } from '../models/tenant.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}`;

  resolveByCode(code: string): Observable<ApiResponse<TenantResolution>> {
    return this.http.get<ApiResponse<TenantResolution>>(`${this.apiUrl}/tenant/resolve`, {
      params: { code },
    });
  }

  resolveByEmail(email: string): Observable<ApiResponse<TenantResolution[]>> {
    return this.http.get<ApiResponse<TenantResolution[]>>(`${this.apiUrl}/tenant/resolve-by-email`, {
      params: { email },
    });
  }

  getTenantModules(tenantId: string): Observable<ApiResponse<TenantModule[]>> {
    return this.http.get<ApiResponse<TenantModule[]>>(`${this.apiUrl}/tenant/${tenantId}/modules`);
  }

  getSubscription(tenantId: string): Observable<ApiResponse<Subscription>> {
    return this.http.get<ApiResponse<Subscription>>(`${this.apiUrl}/tenant/${tenantId}/subscription`);
  }

  getOnboardingStatus(): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.get<ApiResponse<OnboardingStatus>>(`${this.apiUrl}/tenant/onboarding`);
  }

  completeOnboardingStep(step: string, data: Record<string, unknown>): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.post<ApiResponse<OnboardingStatus>>(`${this.apiUrl}/tenant/onboarding?step=${step}`, data);
  }
}
