import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor, DoctorWithSlots, DoctorAvailability, UpdateAvailabilityRequest } from '../models/doctor.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/hms/doctors`;

  getDoctors(): Observable<ApiResponse<Doctor[]>> {
    return this.http.get<ApiResponse<Doctor[]>>(this.apiUrl);
  }

  getDoctorsWithSlots(date: string): Observable<ApiResponse<DoctorWithSlots[]>> {
    return this.http.get<ApiResponse<DoctorWithSlots[]>>(`${this.apiUrl}/with-slots?date=${date}`);
  }

  getDoctorById(id: string): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${this.apiUrl}/${id}`);
  }

  createDoctor(doctor: Partial<Doctor>): Observable<ApiResponse<Doctor>> {
    return this.http.post<ApiResponse<Doctor>>(this.apiUrl, doctor);
  }

  updateDoctor(id: string, doctor: Partial<Doctor>): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(`${this.apiUrl}/${id}`, doctor);
  }

  deleteDoctor(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  getAvailability(doctorId: string): Observable<ApiResponse<DoctorAvailability[]>> {
    return this.http.get<ApiResponse<DoctorAvailability[]>>(`${this.apiUrl}/${doctorId}/availability`);
  }

  setAvailability(doctorId: string, availability: UpdateAvailabilityRequest): Observable<ApiResponse<DoctorAvailability[]>> {
    return this.http.put<ApiResponse<DoctorAvailability[]>>(`${this.apiUrl}/${doctorId}/availability`, availability);
  }
}
