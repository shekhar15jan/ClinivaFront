import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { ClinicSettings } from '../models/setting.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/settings`;

  get(): Observable<ApiResponse<ClinicSettings>> {
    return this.http.get<ApiResponse<ClinicSettings>>(this.baseUrl);
  }

  update(settings: Partial<ClinicSettings>): Observable<ApiResponse<ClinicSettings>> {
    return this.http.put<ApiResponse<ClinicSettings>>(this.baseUrl, settings);
  }
}
