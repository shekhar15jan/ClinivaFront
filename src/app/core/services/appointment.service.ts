import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../models/appointment.model';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/hms/appointments`;

  getAppointments(
    page = 0,
    size = 50,
    status?: string,
    doctorId?: string,
    /** Inclusive day range, YYYY-MM-DD. */
    dateFrom?: string,
    dateTo?: string,
  ): Observable<ApiResponse<PagedResponse<Appointment>>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    if (doctorId) url += `&doctorId=${doctorId}`;
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;
    return this.http
      .get<ApiResponse<RawPagedResponse<Appointment>>>(url)
      .pipe(
        map((response) => ({
          ...response,
          data: PagedResponse.from(response.data),
        })),
      );
  }

  createAppointment(request: CreateAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(this.apiUrl, request);
  }

  getAppointmentById(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.get<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`);
  }

  updateAppointment(id: string, request: UpdateAppointmentRequest): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`, request);
  }

  approveAppointment(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/approve`, {});
  }

  cancelAppointment(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.delete<ApiResponse<Appointment>>(`${this.apiUrl}/${id}`);
  }

  rejectAppointment(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(`${this.apiUrl}/${id}/reject`, {});
  }

  /** The signed-in doctor's appointments. The server works out who that is; no id is sent. */
  getDoctorAppointments(): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/doctor/logged-in`);
  }

  /** The signed-in patient's appointments. The server works out who that is; no id is sent. */
  getPatientAppointments(): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/patient/logged-in`);
  }

  getAvailableSlots(doctorId: string, date: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/slots`, {
      params: { doctorId, date },
    });
  }
}
