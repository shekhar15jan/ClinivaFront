import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { Prescription, CreatePrescriptionRequest, UpdatePrescriptionRequest } from '../models/prescription.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/prescriptions`;

  getPrescriptions(
    page?: number,
    size?: number,
  ): Observable<ApiResponse<PagedResponse<Prescription>>> {
    let params = new HttpParams();
    if (page !== undefined) params = params.set('page', page);
    if (size !== undefined) params = params.set('size', size);
    return this.http.get<ApiResponse<PagedResponse<Prescription>>>(this.baseUrl, { params });
  }

  getPrescriptionById(id: string): Observable<ApiResponse<Prescription>> {
    return this.http.get<ApiResponse<Prescription>>(`${this.baseUrl}/${id}`);
  }

  getPrescriptionsByPatient(patientId: string): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.baseUrl}/patient/${patientId}`);
  }

  getDoctorPrescriptions(doctorId: string): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.baseUrl}/doctor/logged-in`, {
      params: { doctorId },
    });
  }

  getPatientPrescriptions(patientId: string): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.baseUrl}/patient/logged-in`, {
      params: { patientId },
    });
  }

  getByAppointment(appointmentId: string): Observable<ApiResponse<Prescription>> {
    return this.http.get<ApiResponse<Prescription>>(`${this.baseUrl}/appointment/${appointmentId}`);
  }

  createPrescription(request: CreatePrescriptionRequest): Observable<ApiResponse<Prescription>> {
    return this.http.post<ApiResponse<Prescription>>(this.baseUrl, request);
  }

  updatePrescription(id: string, request: UpdatePrescriptionRequest): Observable<ApiResponse<Prescription>> {
    return this.http.put<ApiResponse<Prescription>>(`${this.baseUrl}/${id}`, request);
  }

  deletePrescription(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
