import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { Department, DepartmentRequest, EmergencyAccess } from '../models/department.model';
import { environment } from '../../../environments/environment';

/** Departments, department access (the clinic switch) and the emergency-access review. */
@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms`;

  getDepartments(): Observable<Department[]> {
    return this.http.get<ApiResponse<Department[]>>(`${this.api}/departments`).pipe(map((res) => res.data ?? []));
  }

  create(request: DepartmentRequest): Observable<Department> {
    return this.http.post<ApiResponse<Department>>(`${this.api}/departments`, request).pipe(map((res) => res.data));
  }

  update(id: string, request: DepartmentRequest): Observable<Department> {
    return this.http.put<ApiResponse<Department>>(`${this.api}/departments/${id}`, request).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/departments/${id}`).pipe(map(() => void 0));
  }

  /** Puts a staff member (by login) in a department; null makes them clinic-wide. */
  assignStaff(userId: string, departmentId: string | null): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.api}/departments/staff`, { userId, departmentId })
      .pipe(map(() => void 0));
  }

  /** Puts a doctor in a department; null makes them clinic-wide. */
  assignDoctor(doctorId: string, departmentId: string | null): Observable<void> {
    return this.http
      .put<ApiResponse<void>>(`${this.api}/departments/doctors`, { doctorId, departmentId })
      .pipe(map(() => void 0));
  }

  getAccessSettings(): Observable<{ departmentScoping: boolean }> {
    return this.http
      .get<ApiResponse<{ departmentScoping: boolean }>>(`${this.api}/settings/access`)
      .pipe(map((res) => res.data));
  }

  saveAccessSettings(departmentScoping: boolean): Observable<{ departmentScoping: boolean }> {
    return this.http
      .put<ApiResponse<{ departmentScoping: boolean }>>(`${this.api}/settings/access`, { departmentScoping })
      .pipe(map((res) => res.data));
  }

  getEmergencyAccess(pending: boolean, page = 0, size = 20): Observable<PagedResponse<EmergencyAccess>> {
    const params = new HttpParams().set('pending', pending).set('page', page).set('size', size);
    return this.http
      .get<ApiResponse<RawPagedResponse<EmergencyAccess>>>(`${this.api}/emergency-access`, { params })
      .pipe(map((res) => PagedResponse.from(res.data)));
  }

  review(id: string, note: string): Observable<EmergencyAccess> {
    return this.http
      .put<ApiResponse<EmergencyAccess>>(`${this.api}/emergency-access/${id}/review`, { note })
      .pipe(map((res) => res.data));
  }
}
