import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

export type RecordKind = 'OP_CONSULTATION' | 'PRESCRIPTION' | 'DIAGNOSTIC_REPORT' | 'DISCHARGE_SUMMARY';

export interface AbdmStatus {
  gatewayConfigured: boolean;
  gateway: string | null;
  hfrId: string | null;
  patientsWithAbha: number;
  doctorsWithHpr: number;
  doctors: number;
  toDo: string[];
  doctorIds: { id: string; name: string; hprId: string | null }[];
}

export interface RecordRef {
  kind: RecordKind;
  id: string;
  date: string | null;
  title: string;
}

/** ABDM: set-up, patients' ABHA, and records as FHIR documents. */
@Injectable({ providedIn: 'root' })
export class AbdmService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/abdm`;

  status(): Observable<AbdmStatus> {
    return this.http.get<ApiResponse<AbdmStatus>>(`${this.api}/status`).pipe(map((r) => r.data));
  }

  setFacility(hfrId: string | null): Observable<AbdmStatus> {
    return this.http.put<ApiResponse<AbdmStatus>>(`${this.api}/facility`, { hfrId }).pipe(map((r) => r.data));
  }

  setDoctorHpr(doctorId: string, hprId: string | null): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.api}/doctors/${doctorId}`, { hprId }).pipe(map(() => void 0));
  }

  setAbha(patientId: string, abhaNumber: string | null, abhaAddress: string | null): Observable<{ abhaNumber: string; abhaAddress: string }> {
    return this.http
      .put<ApiResponse<{ abhaNumber: string; abhaAddress: string }>>(`${this.api}/patients/${patientId}/abha`, { abhaNumber, abhaAddress })
      .pipe(map((r) => r.data));
  }

  records(patientId: string): Observable<RecordRef[]> {
    return this.http.get<ApiResponse<RecordRef[]>>(`${this.api}/patients/${patientId}/records`).pipe(map((r) => r.data ?? []));
  }

  document(kind: RecordKind, id: string): Observable<Blob> {
    return this.http.get(`${this.api}/records/${kind}/${id}`, { responseType: 'blob' });
  }
}
