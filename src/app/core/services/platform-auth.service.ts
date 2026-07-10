import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformAuthService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/platform/auth`;

  login(email: string, password: string): Observable<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return this.http.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(`${this.baseUrl}/login`, { email, password });
  }

  refresh(refreshToken: string): Observable<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return this.http.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(`${this.baseUrl}/refresh`, { refreshToken });
  }
}
