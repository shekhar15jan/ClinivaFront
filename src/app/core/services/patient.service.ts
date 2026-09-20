import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Patient, PatientVisitResponse } from '../models/patient.model';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
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
  ): Observable<ApiResponse<PagedResponse<Patient>>> {
    return this.http
      .get<ApiResponse<RawPagedResponse<Patient>>>(`${this.apiUrl}?page=${page}&size=${size}`)
      .pipe(
        map((response) => ({
          ...response,
          data: PagedResponse.from(response.data),
        })),
      );
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

  getPatientVisits(id: string): Observable<ApiResponse<PatientVisitResponse>> {
    return this.http.get<ApiResponse<PatientVisitResponse>>(`${this.apiUrl}/${id}/visits`);
  }

  /** The signed-in patient's own record (portal). */
  getMyProfile(): Observable<ApiResponse<Patient>> {
    return this.http.get<ApiResponse<Patient>>(`${this.apiUrl}/me`);
  }

  /** A patient updating their own details. */
  updateMyProfile(patient: Partial<Patient>): Observable<ApiResponse<Patient>> {
    return this.http.put<ApiResponse<Patient>>(`${this.apiUrl}/me`, patient);
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
