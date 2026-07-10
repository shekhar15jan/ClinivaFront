import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { ManagedUser, CreateManagedUserRequest } from '../models/user-management.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/hms/users`;

  getUsers(page = 0, size = 20): Observable<PagedResponse<ManagedUser>> {
    return this.http
      .get<ApiResponse<PagedResponse<ManagedUser>>>(`${this.apiUrl}?page=${page}&size=${size}`)
      .pipe(map((res) => res.data));
  }

  getUserById(id: string): Observable<ManagedUser> {
    return this.http
      .get<ApiResponse<ManagedUser>>(`${this.apiUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  createUser(request: CreateManagedUserRequest): Observable<ManagedUser> {
    return this.http
      .post<ApiResponse<ManagedUser>>(this.apiUrl, request)
      .pipe(map((res) => res.data));
  }

  deactivateUser(id: string): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(map(() => void 0));
  }

  activateUser(id: string): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(map(() => void 0));
  }

  resetPassword(id: string): Observable<{ temporaryPassword: string }> {
    return this.http
      .post<ApiResponse<{ temporaryPassword: string }>>(`${this.apiUrl}/${id}/reset-password`, {})
      .pipe(map((res) => res.data));
  }
}
