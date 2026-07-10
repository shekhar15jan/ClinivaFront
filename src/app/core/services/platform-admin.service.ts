import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { PlatformUser, Product, PlatformModule, SubscriptionPlan, SupportTicket, PlatformReport } from '../models/platform.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformAdminService {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;

  // Platform Users
  createUser(data: { email: string; password: string; role: string }): Observable<ApiResponse<PlatformUser>> {
    return this.http.post<ApiResponse<PlatformUser>>(`${this.apiUrl}/platform/users`, data);
  }

  // Products
  listProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiUrl}/platform/products`);
  }

  createProduct(data: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.apiUrl}/platform/products`, data);
  }

  // Modules
  listModules(): Observable<ApiResponse<PlatformModule[]>> {
    return this.http.get<ApiResponse<PlatformModule[]>>(`${this.apiUrl}/platform/modules`);
  }

  createModule(data: Partial<PlatformModule>): Observable<ApiResponse<PlatformModule>> {
    return this.http.post<ApiResponse<PlatformModule>>(`${this.apiUrl}/platform/modules`, data);
  }

  // Plans
  listPlans(): Observable<ApiResponse<SubscriptionPlan[]>> {
    return this.http.get<ApiResponse<SubscriptionPlan[]>>(`${this.apiUrl}/platform/plans`);
  }

  createPlan(data: Partial<SubscriptionPlan>): Observable<ApiResponse<SubscriptionPlan>> {
    return this.http.post<ApiResponse<SubscriptionPlan>>(`${this.apiUrl}/platform/plans`, data);
  }

  updatePlan(id: string, data: Partial<SubscriptionPlan>): Observable<ApiResponse<SubscriptionPlan>> {
    return this.http.put<ApiResponse<SubscriptionPlan>>(`${this.apiUrl}/platform/plans/${id}`, data);
  }

  // Support Tickets
  listTickets(): Observable<ApiResponse<SupportTicket[]>> {
    return this.http.get<ApiResponse<SupportTicket[]>>(`${this.apiUrl}/platform/support/tickets`);
  }

  createTicket(data: Partial<SupportTicket>): Observable<ApiResponse<SupportTicket>> {
    return this.http.post<ApiResponse<SupportTicket>>(`${this.apiUrl}/platform/support/tickets`, data);
  }

  // Reports
  getTenantMetrics(): Observable<ApiResponse<PlatformReport>> {
    return this.http.get<ApiResponse<PlatformReport>>(`${this.apiUrl}/platform/reports/tenants`);
  }

  getRevenueReport(): Observable<ApiResponse<PlatformReport>> {
    return this.http.get<ApiResponse<PlatformReport>>(`${this.apiUrl}/platform/reports/revenue`);
  }

  // Audit Logs
  listPlatformAuditLogs(params?: { page?: number; size?: number }): Observable<ApiResponse<{ content: unknown[]; totalElements: number }>> {
    return this.http.get<ApiResponse<{ content: unknown[]; totalElements: number }>>(`${this.apiUrl}/platform/audit-logs`, { params: params as Record<string, string> });
  }

  listTenantAuditLogs(tenantId: string): Observable<ApiResponse<{ content: unknown[]; totalElements: number }>> {
    return this.http.get<ApiResponse<{ content: unknown[]; totalElements: number }>>(`${this.apiUrl}/platform/audit-logs/tenant/${tenantId}`);
  }
}
