import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { IssueLetterRequest, Letter } from '../models/letter.model';
import { environment } from '../../../environments/environment';

/** Medical certificates, fitness certificates and referral letters issued from a consultation. */
@Injectable({ providedIn: 'root' })
export class LetterService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/hms`;

  list(consultationId: string): Observable<ApiResponse<Letter[]>> {
    return this.http.get<ApiResponse<Letter[]>>(`${this.base}/consultations/${consultationId}/letters`);
  }

  issue(consultationId: string, request: IssueLetterRequest): Observable<ApiResponse<Letter>> {
    return this.http.post<ApiResponse<Letter>>(`${this.base}/consultations/${consultationId}/letters`, request);
  }

  pdf(letterId: string): Observable<Blob> {
    return this.http.get(`${this.base}/letters/${letterId}/pdf`, { responseType: 'blob' });
  }
}
