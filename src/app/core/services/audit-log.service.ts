import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { AuditLog } from '../models/audit-log.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/hms/audit-logs`;

  getAuditLogs(params: {
    page?: number;
    size?: number;
    startDate?: string;
    endDate?: string;
    userId?: string;
    entity?: string;
    action?: string;
  }): Observable<PagedResponse<AuditLog>> {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.set('page', String(params.page));
    if (params.size !== undefined) queryParams.set('size', String(params.size));
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.userId) queryParams.set('userId', params.userId);
    if (params.entity) queryParams.set('entity', params.entity);
    if (params.action) queryParams.set('action', params.action);

    return this.http
      .get<ApiResponse<PagedResponse<AuditLog>>>(`${this.apiUrl}?${queryParams.toString()}`)
      .pipe(map((res) => res.data));
  }
}
