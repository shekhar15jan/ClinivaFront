import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import {
  Prescription, CreatePrescriptionRequest, UpdatePrescriptionRequest,
  PrescriptionTemplate, CreatePrescriptionTemplateRequest
} from '../models/prescription.model';
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
    return this.http
      .get<ApiResponse<RawPagedResponse<Prescription>>>(this.baseUrl, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: PagedResponse.from(response.data),
        })),
      );
  }

  getPrescriptionById(id: string): Observable<ApiResponse<Prescription>> {
    return this.http.get<ApiResponse<Prescription>>(`${this.baseUrl}/${id}`);
  }

  getPrescriptionsByPatient(patientId: string): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.baseUrl}/patient/${patientId}`);
  }

  /** The signed-in doctor's prescriptions. The server works out who that is; no id is sent. */
  getDoctorPrescriptions(): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.baseUrl}/doctor/logged-in`);
  }

  /** The signed-in patient's prescriptions. The server works out who that is; no id is sent. */
  getPatientPrescriptions(): Observable<ApiResponse<Prescription[]>> {
    return this.http.get<ApiResponse<Prescription[]>>(`${this.baseUrl}/patient/logged-in`);
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

  getTemplates(): Observable<ApiResponse<PrescriptionTemplate[]>> {
    return this.http.get<ApiResponse<PrescriptionTemplate[]>>(`${this.baseUrl}/templates`);
  }

  getTemplateById(id: string): Observable<ApiResponse<PrescriptionTemplate>> {
    return this.http.get<ApiResponse<PrescriptionTemplate>>(`${this.baseUrl}/templates/${id}`);
  }

  createTemplate(request: CreatePrescriptionTemplateRequest): Observable<ApiResponse<PrescriptionTemplate>> {
    return this.http.post<ApiResponse<PrescriptionTemplate>>(`${this.baseUrl}/templates`, request);
  }

  updateTemplate(id: string, request: CreatePrescriptionTemplateRequest): Observable<ApiResponse<PrescriptionTemplate>> {
    return this.http.put<ApiResponse<PrescriptionTemplate>>(`${this.baseUrl}/templates/${id}`, request);
  }

  deleteTemplate(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/templates/${id}`);
  }
}
