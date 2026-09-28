import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { CreateContactRequest, ContactMessageResponse } from '../models/contact.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/contacts`;

  submit(request: CreateContactRequest): Observable<ApiResponse<ContactMessageResponse>> {
    return this.http.post<ApiResponse<ContactMessageResponse>>(this.baseUrl, request);
  }

  /** One page of messages, newest first; the status filter and search run on the server. */
  list(query: { page?: number; size?: number; status?: string; q?: string } = {}):
    Observable<ApiResponse<PagedResponse<ContactMessageResponse>>> {
    const params: Record<string, string | number> = { page: query.page ?? 0, size: query.size ?? 20 };
    if (query.status) params['status'] = query.status;
    if (query.q?.trim()) params['q'] = query.q.trim();
    return this.http
      .get<ApiResponse<RawPagedResponse<ContactMessageResponse>>>(this.baseUrl, { params })
      .pipe(map((res) => ({ ...res, data: PagedResponse.from(res.data ?? { content: [] }) })));
  }

  /** Messages in each status: NEW, IN_PROGRESS, RESOLVED. */
  counts(): Observable<ApiResponse<Record<string, number>>> {
    return this.http.get<ApiResponse<Record<string, number>>>(`${this.baseUrl}/counts`);
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
