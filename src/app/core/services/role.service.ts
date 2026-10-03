import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { CustomRole, CustomRoleRequest, RolesOverview } from '../models/user-management.model';
import { environment } from '../../../environments/environment';

/** Built-in and custom roles (owner only). */
@Injectable({ providedIn: 'root' })
export class RoleService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/hms/roles`;

  getOverview(): Observable<RolesOverview> {
    return this.http.get<ApiResponse<RolesOverview>>(this.apiUrl).pipe(map((res) => res.data));
  }

  create(request: CustomRoleRequest): Observable<CustomRole> {
    return this.http.post<ApiResponse<CustomRole>>(this.apiUrl, request).pipe(map((res) => res.data));
  }

  update(id: string, request: CustomRoleRequest): Observable<CustomRole> {
    return this.http.put<ApiResponse<CustomRole>>(`${this.apiUrl}/${id}`, request).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(map(() => void 0));
  }
}
