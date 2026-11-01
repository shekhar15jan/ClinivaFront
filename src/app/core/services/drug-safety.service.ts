import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { Allergy, AllergySeverity, SafetyWarning } from '../models/drug-safety.model';
import { environment } from '../../../environments/environment';

/** A patient's allergies, and the check a doctor runs on the drugs of a prescription before saving it. */
@Injectable({ providedIn: 'root' })
export class DrugSafetyService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/hms`;

  allergies(patientId: string): Observable<ApiResponse<Allergy[]>> {
    return this.http.get<ApiResponse<Allergy[]>>(`${this.base}/patients/${patientId}/allergies`);
  }

  addAllergy(patientId: string, substance: string, severity: AllergySeverity, reaction?: string): Observable<ApiResponse<Allergy>> {
    return this.http.post<ApiResponse<Allergy>>(`${this.base}/patients/${patientId}/allergies`, {
      substance,
      severity,
      reaction: reaction?.trim() || undefined,
    });
  }

  removeAllergy(patientId: string, allergyId: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/patients/${patientId}/allergies/${allergyId}`);
  }

  /** Every warning for these drugs given to this patient, serious ones first. */
  check(patientId: string, medicines: { medicineId?: string; medicineName: string }[]): Observable<ApiResponse<SafetyWarning[]>> {
    return this.http.post<ApiResponse<SafetyWarning[]>>(`${this.base}/prescriptions/safety-check`, { patientId, medicines });
  }
}
