import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

export type SupportRequestStatus = 'REQUESTED' | 'APPROVED' | 'DENIED' | 'CANCELLED' | 'REVOKED' | 'ENDED' | 'EXPIRED';

/** A request from CodeAtCloud support, as the clinic owner sees it. */
export interface SupportRequestView {
  id: string;
  status: SupportRequestStatus;
  staffName: string | null;
  staffRole: string;
  reason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedMinutes: number | null;
  expiresAt: string | null;
  sessionOpen: boolean;
}

export interface SupportLogView {
  platform: { id: string; actor: string; action: string; detail: string | null; createdAt: string }[];
  clinic: {
    id: string; staffName: string | null; staffRole: string; event: string;
    method: string | null; path: string | null; status: number | null; createdAt: string;
  }[];
}

/** Choices offered for how long support may stay; the default is the first, 4 hours. */
export const SUPPORT_DURATIONS = [
  { minutes: 240, label: '4 hours' },
  { minutes: 120, label: '2 hours' },
  { minutes: 60, label: '1 hour' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 15, label: '15 minutes' },
];

/** The clinic owner side of support access: see requests, approve for a time, deny, or take the approval back. */
@Injectable({ providedIn: 'root' })
export class SupportAccessService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/hms/support-access`;

  open(): Observable<SupportRequestView[]> {
    return this.http.get<ApiResponse<SupportRequestView[]>>(`${this.base}/requests`).pipe(map((r) => r.data ?? []));
  }

  approve(id: string, minutes: number): Observable<SupportRequestView> {
    return this.http.post<ApiResponse<SupportRequestView>>(`${this.base}/requests/${id}/approve`, { minutes }).pipe(map((r) => r.data));
  }

  deny(id: string): Observable<SupportRequestView> {
    return this.http.post<ApiResponse<SupportRequestView>>(`${this.base}/requests/${id}/deny`, {}).pipe(map((r) => r.data));
  }

  revoke(id: string): Observable<SupportRequestView> {
    return this.http.post<ApiResponse<SupportRequestView>>(`${this.base}/requests/${id}/revoke`, {}).pipe(map((r) => r.data));
  }

  log(): Observable<SupportLogView> {
    return this.http.get<ApiResponse<SupportLogView>>(`${this.base}/log`).pipe(map((r) => r.data));
  }
}
