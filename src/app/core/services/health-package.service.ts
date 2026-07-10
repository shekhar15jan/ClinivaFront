import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse } from '../models/common.model';
import {
  CreateHealthPackageRequest, UpdateHealthPackageRequest,
  HealthPackageResponse, BookHealthPackageRequest, HealthPackageBookingResponse
} from '../models/health-package.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthPackageService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/health-packages`;

  list(page?: number, size?: number): Observable<ApiResponse<PagedResponse<HealthPackageResponse>>> {
    let params = new HttpParams();
    if (page !== undefined) params = params.set('page', page);
    if (size !== undefined) params = params.set('size', size);
    return this.http.get<ApiResponse<PagedResponse<HealthPackageResponse>>>(this.baseUrl, { params });
  }

  create(request: CreateHealthPackageRequest): Observable<ApiResponse<HealthPackageResponse>> {
    return this.http.post<ApiResponse<HealthPackageResponse>>(this.baseUrl, request);
  }

  update(id: string, request: UpdateHealthPackageRequest): Observable<ApiResponse<HealthPackageResponse>> {
    return this.http.put<ApiResponse<HealthPackageResponse>>(`${this.baseUrl}/${id}`, request);
  }

  toggleActive(id: string): Observable<ApiResponse<HealthPackageResponse>> {
    return this.http.put<ApiResponse<HealthPackageResponse>>(`${this.baseUrl}/${id}/toggle`, {});
  }

  book(id: string, request: BookHealthPackageRequest): Observable<ApiResponse<HealthPackageBookingResponse>> {
    return this.http.post<ApiResponse<HealthPackageBookingResponse>>(`${this.baseUrl}/${id}/book`, request);
  }

  listBookings(): Observable<ApiResponse<HealthPackageBookingResponse[]>> {
    return this.http.get<ApiResponse<HealthPackageBookingResponse[]>>(`${this.baseUrl}/bookings`);
  }

  approveBooking(id: string): Observable<ApiResponse<HealthPackageBookingResponse>> {
    return this.http.put<ApiResponse<HealthPackageBookingResponse>>(`${this.baseUrl}/bookings/${id}/approve`, {});
  }

  rejectBooking(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.baseUrl}/bookings/${id}/reject`, {});
  }
}
