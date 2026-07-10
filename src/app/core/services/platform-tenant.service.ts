import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { PlatformTenant, PlatformModule } from '../models/platform.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformTenantService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/platform/tenants`;

  list(): Observable<ApiResponse<PlatformTenant[]>> {
    return this.http.get<ApiResponse<PlatformTenant[]>>(this.baseUrl);
  }

  getById(id: string): Observable<ApiResponse<PlatformTenant>> {
    return this.http.get<ApiResponse<PlatformTenant>>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<PlatformTenant>): Observable<ApiResponse<PlatformTenant>> {
    return this.http.post<ApiResponse<PlatformTenant>>(this.baseUrl, data);
  }

  update(id: string, data: Partial<PlatformTenant>): Observable<ApiResponse<PlatformTenant>> {
    return this.http.put<ApiResponse<PlatformTenant>>(`${this.baseUrl}/${id}`, data);
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<PlatformTenant>> {
    return this.http.put<ApiResponse<PlatformTenant>>(`${this.baseUrl}/${id}/status`, { status });
  }

  getSubscription(tenantId: string): Observable<ApiResponse<{ planName: string; status: string; endDate: string }>> {
    return this.http.get<ApiResponse<{ planName: string; status: string; endDate: string }>>(`${this.baseUrl}/${tenantId}/subscription`);
  }

  assignPlan(tenantId: string, planId: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${tenantId}/subscription`, { planId });
  }

  updateModuleStatus(tenantId: string, moduleId: string, status: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/${tenantId}/modules/${moduleId}`, { status });
  }

  listModules(tenantId: string): Observable<ApiResponse<PlatformModule[]>> {
    return this.http.get<ApiResponse<PlatformModule[]>>(`${this.baseUrl}/${tenantId}/modules`);
  }
}
