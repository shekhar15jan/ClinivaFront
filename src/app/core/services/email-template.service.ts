import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { EmailTemplate, EmailTemplateRequest } from '../models/email-template.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/hms/settings/email-templates`;

  getTemplates(): Observable<ApiResponse<EmailTemplate[]>> {
    return this.http.get<ApiResponse<EmailTemplate[]>>(this.baseUrl);
  }

  getTemplateById(id: string): Observable<ApiResponse<EmailTemplate>> {
    return this.http.get<ApiResponse<EmailTemplate>>(`${this.baseUrl}/${id}`);
  }

  createTemplate(request: EmailTemplateRequest): Observable<ApiResponse<EmailTemplate>> {
    return this.http.post<ApiResponse<EmailTemplate>>(this.baseUrl, request);
  }

  updateTemplate(id: string, request: EmailTemplateRequest): Observable<ApiResponse<EmailTemplate>> {
    return this.http.put<ApiResponse<EmailTemplate>>(`${this.baseUrl}/${id}`, request);
  }

  deleteTemplate(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}
