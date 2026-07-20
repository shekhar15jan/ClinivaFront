import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import {
  DashboardStats,
  AppointmentTrend,
  RevenueReport,
  DoctorPerformance,
  BillsStatusReport,
} from '../models/report.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/reports`;

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.baseUrl}/dashboard`);
  }

  getAppointmentTrends(): Observable<ApiResponse<AppointmentTrend[]>> {
    return this.http.get<ApiResponse<AppointmentTrend[]>>(`${this.baseUrl}/appointment-trends`);
  }

  getRevenueReport(): Observable<ApiResponse<RevenueReport>> {
    return this.http.get<ApiResponse<RevenueReport>>(`${this.baseUrl}/revenue`);
  }

  getDoctorPerformance(): Observable<ApiResponse<DoctorPerformance[]>> {
    return this.http.get<ApiResponse<DoctorPerformance[]>>(`${this.baseUrl}/doctor-performance`);
  }

  getAppointmentsPerMonth(): Observable<ApiResponse<AppointmentTrend[]>> {
    return this.http.get<ApiResponse<AppointmentTrend[]>>(`${this.baseUrl}/appointments-per-month`);
  }

  getBillsStatus(): Observable<ApiResponse<BillsStatusReport>> {
    return this.http.get<ApiResponse<BillsStatusReport>>(`${this.baseUrl}/bills-status`);
  }

  exportReportPdf(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/pdf`, {
      responseType: 'blob'
    });
  }
}
