import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient, PatientVisit } from '../models/patient.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/hms/patients`;

  getPatients(
    page = 0,
    size = 10,
    search?: string,
  ): Observable<ApiResponse<PagedResponse<Patient>>> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<ApiResponse<PagedResponse<Patient>>>(url);
  }

  getPatientById(id: string): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.post<ApiResponse<Patient>>(this.apiUrl, patient);
  }

  updatePatient(id: string, patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/${id}`, patient);
  }

  getPatientVisits(id: string): Observable<ApiResponse<PatientVisit[]>> {
    return this.http.get<ApiResponse<PatientVisit[]>>(`${this.apiUrl}/${id}/visits`);
  }

  searchPatients(query: string): Observable<ApiResponse<Patient[]>> {
    return this.http.get<ApiResponse<Patient[]>>(`${this.apiUrl}/search`, {
      params: { q: query },
    });
  }

  uploadPatients(file: File): Observable<ApiResponse<{ imported: number; errors: string[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ imported: number; errors: string[] }>>(`${this.apiUrl}/upload`, formData);
  }

  deletePatient(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
