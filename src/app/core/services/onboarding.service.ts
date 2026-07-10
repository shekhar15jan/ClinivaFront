import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { OnboardingStatus, ClinicConfig, DepartmentConfig, DoctorConfig, StaffConfig } from '../models/tenant.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/tenant/onboarding`;

  getStatus(): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.get<ApiResponse<OnboardingStatus>>(this.apiUrl);
  }

  saveClinicConfig(config: ClinicConfig): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.post<ApiResponse<OnboardingStatus>>(`${this.apiUrl}?step=CLINIC`, config);
  }

  saveDepartments(departments: DepartmentConfig[]): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.post<ApiResponse<OnboardingStatus>>(`${this.apiUrl}?step=DEPARTMENTS`, { departments });
  }

  saveDoctors(doctors: DoctorConfig[]): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.post<ApiResponse<OnboardingStatus>>(`${this.apiUrl}?step=DOCTORS`, { doctors });
  }

  saveStaff(staff: StaffConfig[]): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.post<ApiResponse<OnboardingStatus>>(`${this.apiUrl}?step=STAFF`, { staff });
  }

  complete(): Observable<ApiResponse<OnboardingStatus>> {
    return this.http.post<ApiResponse<OnboardingStatus>>(`${this.apiUrl}?step=COMPLETE`, {});
  }
}
