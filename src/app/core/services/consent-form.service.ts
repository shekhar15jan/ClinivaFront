import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { ConsentForm, CreateConsentFormRequest, SignConsentFormRequest } from '../models/consent-form.model';
import { environment } from '../../../environments/environment';

/** Consent forms for procedures, anaesthesia and admission. */
@Injectable({ providedIn: 'root' })
export class ConsentFormService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/hms`;

  list(patientId: string): Observable<ApiResponse<ConsentForm[]>> {
    return this.http.get<ApiResponse<ConsentForm[]>>(`${this.base}/patients/${patientId}/consent-forms`);
  }

  create(patientId: string, request: CreateConsentFormRequest): Observable<ApiResponse<ConsentForm>> {
    return this.http.post<ApiResponse<ConsentForm>>(`${this.base}/patients/${patientId}/consent-forms`, request);
  }

  sign(id: string, request: SignConsentFormRequest): Observable<ApiResponse<ConsentForm>> {
    return this.http.post<ApiResponse<ConsentForm>>(`${this.base}/consent-forms/${id}/sign`, request);
  }

  refuse(id: string): Observable<ApiResponse<ConsentForm>> {
    return this.http.post<ApiResponse<ConsentForm>>(`${this.base}/consent-forms/${id}/refuse`, {});
  }

  pdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/consent-forms/${id}/pdf`, { responseType: 'blob' });
  }
}
