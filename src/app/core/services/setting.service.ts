import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { ClinicProfile, ClinicSettings } from '../models/setting.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/settings`;

  /** The clinic's name, address, phone, email and logo (readable by every role, unlike the settings). */
  getProfile(): Observable<ApiResponse<ClinicProfile>> {
    return this.http.get<ApiResponse<ClinicProfile>>(`${this.baseUrl}/profile`);
  }

  /** Whether patients get an email the day before their appointment. */
  getReminders(): Observable<ApiResponse<{ enabled: boolean }>> {
    return this.http.get<ApiResponse<{ enabled: boolean }>>(`${this.baseUrl}/reminders`);
  }

  setReminders(enabled: boolean): Observable<ApiResponse<{ enabled: boolean }>> {
    return this.http.put<ApiResponse<{ enabled: boolean }>>(`${this.baseUrl}/reminders`, { enabled });
  }

  get(): Observable<ApiResponse<ClinicSettings>> {
    return this.http.get<ApiResponse<ClinicSettings>>(this.baseUrl);
  }

  update(settings: Partial<ClinicSettings>): Observable<ApiResponse<ClinicSettings>> {
    return this.http.put<ApiResponse<ClinicSettings>>(this.baseUrl, settings);
  }

  uploadLogo(file: File): Observable<ApiResponse<ClinicSettings>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<ClinicSettings>>(`${this.baseUrl}/logo`, form);
  }

  removeLogo(): Observable<ApiResponse<ClinicSettings>> {
    return this.http.delete<ApiResponse<ClinicSettings>>(`${this.baseUrl}/logo`);
  }
}
