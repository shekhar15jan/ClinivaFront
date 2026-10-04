import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { Chart, NoteKind, OrderRequest, Outcome, RoundItem, Shift, VitalsRequest } from '../models/nursing.model';
import { environment } from '../../../environments/environment';

/** The ward round and an inpatient's nursing chart. */
@Injectable({ providedIn: 'root' })
export class NursingService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/nursing`;

  round(wardId?: string | null): Observable<RoundItem[]> {
    const params = wardId ? new HttpParams().set('wardId', wardId) : undefined;
    return this.http.get<ApiResponse<RoundItem[]>>(`${this.api}/round`, { params }).pipe(map((r) => r.data ?? []));
  }

  chart(admissionId: string): Observable<Chart> {
    return this.http.get<ApiResponse<Chart>>(`${this.api}/admissions/${admissionId}`).pipe(map((r) => r.data));
  }

  vitals(admissionId: string, request: VitalsRequest): Observable<Chart> {
    return this.http.post<ApiResponse<Chart>>(`${this.api}/admissions/${admissionId}/vitals`, request).pipe(map((r) => r.data));
  }

  order(admissionId: string, request: OrderRequest): Observable<Chart> {
    return this.http.post<ApiResponse<Chart>>(`${this.api}/admissions/${admissionId}/orders`, request).pipe(map((r) => r.data));
  }

  stop(orderId: string, reason: string): Observable<Chart> {
    return this.http.put<ApiResponse<Chart>>(`${this.api}/orders/${orderId}/stop`, { reason }).pipe(map((r) => r.data));
  }

  dose(orderId: string, scheduledAt: string | null, outcome: Outcome, note: string | null): Observable<Chart> {
    return this.http
      .post<ApiResponse<Chart>>(`${this.api}/orders/${orderId}/doses`, { scheduledAt, outcome, note })
      .pipe(map((r) => r.data));
  }

  note(admissionId: string, kind: NoteKind, shift: Shift | null, text: string): Observable<Chart> {
    return this.http
      .post<ApiResponse<Chart>>(`${this.api}/admissions/${admissionId}/notes`, { kind, shift, text })
      .pipe(map((r) => r.data));
  }
}
