import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

/** The hospital's numbers over a period. A section is null without its module; money is null without finance access. */
export interface Analytics {
  from: string;
  to: string;
  days: number;
  beds: {
    beds: number;
    occupiedNow: number;
    occupancyPercent: number;
    admissions: number;
    discharges: number;
    averageStayDays: number;
    admissionsByType: Record<string, number>;
  } | null;
  revenue: { billedInPaisa: number; bills: number; bySource: { source: string; amountInPaisa: number; bills: number }[] } | null;
  lab: { orders: number; tests: number; verified: number; averageTurnaroundHours: number | null; abnormalPercent: number | null } | null;
  radiology: { orders: number; studies: number; reported: number; averageReportHours: number | null; byModality: Record<string, number> } | null;
  theatre: { booked: number; completed: number; cancelled: number; emergencies: number; hoursInSurgery: number; utilisationPercent: number } | null;
  insurance: { claims: number; byStatus: Record<string, number>; claimedInPaisa: number | null; settledInPaisa: number | null } | null;
  daily: { date: string; admissions: number; discharges: number; surgeries: number; billedInPaisa: number | null }[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/analytics`;

  get(from: string, to: string): Observable<Analytics> {
    return this.http.get<ApiResponse<Analytics>>(this.api, { params: { from, to } }).pipe(map((r) => r.data));
  }
}
