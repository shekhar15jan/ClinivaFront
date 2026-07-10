import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../models/appointment.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
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
  ): Observable<ApiResponse<PagedResponse<Appointment>>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    if (doctorId) url += `&doctorId=${doctorId}`;
    return this.http.get<ApiResponse<PagedResponse<Appointment>>>(url);
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

  getDoctorAppointments(doctorId: string): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/doctor/logged-in`, {
      params: { doctorId },
    });
  }

  getPatientAppointments(patientId: string): Observable<ApiResponse<Appointment[]>> {
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/patient/logged-in`, {
      params: { patientId },
    });
  }

  getAvailableSlots(doctorId: string, date: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/slots`, {
      params: { doctorId, date },
    });
  }
}
