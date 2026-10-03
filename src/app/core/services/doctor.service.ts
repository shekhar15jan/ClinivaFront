import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Doctor, DoctorFilter, DoctorWithSlotsResponse, AvailabilityDto, UpdateAvailabilityRequest } from '../models/doctor.model';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/hms/doctors`;

  getDoctors(
    page = 0,
    size = 20,
    filter: DoctorFilter = {},
  ): Observable<ApiResponse<PagedResponse<Doctor>>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'fullName,asc');
    for (const [key, value] of Object.entries(filter)) {
      if (value) params = params.set(key, value);
    }
    return this.http
      .get<ApiResponse<RawPagedResponse<Doctor>>>(this.apiUrl, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: PagedResponse.from(response.data),
        })),
      );
  }

  /** The specializations the clinic's doctors have, for the filter. */
  getSpecializations(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.apiUrl}/specializations`).pipe(map((res) => res.data ?? []));
  }

  getDoctorsWithSlots(date: string): Observable<ApiResponse<DoctorWithSlotsResponse[]>> {
    return this.http.get<ApiResponse<DoctorWithSlotsResponse[]>>(`${this.apiUrl}/with-slots?date=${date}`);
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

  getAvailability(doctorId: string): Observable<ApiResponse<AvailabilityDto[]>> {
    return this.http.get<ApiResponse<AvailabilityDto[]>>(`${this.apiUrl}/${doctorId}/availability`);
  }

  setAvailability(doctorId: string, availability: UpdateAvailabilityRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/${doctorId}/availability`, availability);
  }

  /** FR-DOC-01: the doctor's photo (PNG, JPEG or WebP, up to 512 KB). */
  uploadPhoto(doctorId: string, file: File): Observable<ApiResponse<Doctor>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<Doctor>>(`${this.apiUrl}/${doctorId}/photo`, form);
  }
}
