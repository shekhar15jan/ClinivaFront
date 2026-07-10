import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { CreateContactRequest, ContactMessageResponse } from '../models/contact.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/contacts`;

  submit(request: CreateContactRequest): Observable<ApiResponse<ContactMessageResponse>> {
    return this.http.post<ApiResponse<ContactMessageResponse>>(this.baseUrl, request);
  }

  list(): Observable<ApiResponse<ContactMessageResponse[]>> {
    return this.http.get<ApiResponse<ContactMessageResponse[]>>(this.baseUrl);
  }

  getByStatus(status: string): Observable<ApiResponse<ContactMessageResponse[]>> {
    return this.http.get<ApiResponse<ContactMessageResponse[]>>(`${this.baseUrl}/status/${status}`);
  }

  reply(id: string, reply: string): Observable<ApiResponse<ContactMessageResponse>> {
    return this.http.put<ApiResponse<ContactMessageResponse>>(`${this.baseUrl}/${id}/reply`, reply, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
