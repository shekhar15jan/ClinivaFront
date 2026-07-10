import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { Consultation, CreateConsultationRequest, Vitals } from '../models/consultation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConsultationService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/consultations`;

  getByAppointment(appointmentId: string): Observable<ApiResponse<Consultation>> {
    return this.http.get<ApiResponse<Consultation>>(`${this.baseUrl}/appointment/${appointmentId}`);
  }

  getById(id: string): Observable<ApiResponse<Consultation>> {
    return this.http.get<ApiResponse<Consultation>>(`${this.baseUrl}/${id}`);
  }

  getPatientHistory(patientId: string): Observable<ApiResponse<Consultation[]>> {
    return this.http.get<ApiResponse<Consultation[]>>(`${this.baseUrl}/patient/${patientId}`);
  }

  createConsultation(request: CreateConsultationRequest): Observable<ApiResponse<Consultation>> {
    return this.http.post<ApiResponse<Consultation>>(this.baseUrl, request);
  }

  updateConsultation(
    id: string,
    data: Partial<Consultation>,
  ): Observable<ApiResponse<Consultation>> {
    return this.http.put<ApiResponse<Consultation>>(`${this.baseUrl}/${id}`, data);
  }

  recordVitals(id: string, vitals: Vitals): Observable<ApiResponse<Consultation>> {
    return this.http.put<ApiResponse<Consultation>>(`${this.baseUrl}/${id}`, { vitals });
  }
}
