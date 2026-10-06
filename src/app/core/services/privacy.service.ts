import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

export type ConsentPurpose = 'CARE' | 'REMINDERS' | 'ABDM_SHARING' | 'MARKETING' | 'RESEARCH';
export type ConsentMethod = 'PORTAL' | 'IN_PERSON' | 'PAPER';
export type GivenBy = 'SELF' | 'GUARDIAN';

export interface PrivacyNotice { version: number; body: string; publishedAt: string | null; builtIn: boolean }
export interface PrivacyOfficer { name: string | null; email: string | null; phone: string | null }
export interface ConsentPurposeInfo { code: ConsentPurpose; label: string; core: boolean }

export interface PrivacySettings {
  officer: PrivacyOfficer;
  consentAge: number;
  notice: PrivacyNotice;
  versions: { version: number; publishedAt: string }[];
  purposes: ConsentPurposeInfo[];
}

export interface PublicPrivacy {
  clinicName: string;
  notice: PrivacyNotice;
  officer: PrivacyOfficer;
  consentAge: number;
  purposes: ConsentPurposeInfo[];
}

export interface ConsentRequest {
  purpose: ConsentPurpose;
  granted: boolean;
  method?: ConsentMethod;
  givenBy?: GivenBy;
  guardianName?: string | null;
  guardianRelation?: string | null;
}

export interface Consent {
  purpose: ConsentPurpose;
  label: string;
  core: boolean;
  granted: boolean | null;
  noticeVersion: number | null;
  method: ConsentMethod | null;
  givenBy: GivenBy | null;
  guardianName: string | null;
  guardianRelation: string | null;
  recordedAt: string | null;
}

export interface PatientConsents {
  minor: boolean;
  consentAge: number;
  noticeVersion: number;
  current: Consent[];
  history: Consent[];
}

/** The clinic's privacy notice and officer, and patients' consents (DPDP, GDPR and similar laws). */
@Injectable({ providedIn: 'root' })
export class PrivacyService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/privacy`;

  /** No sign-in needed: what a clinic shows before anyone registers. */
  publicView(clinicCode: string): Observable<PublicPrivacy> {
    return this.http.get<ApiResponse<PublicPrivacy>>(`${environment.apiUrl}/public/privacy/${encodeURIComponent(clinicCode)}`)
      .pipe(map((r) => r.data));
  }

  settings(): Observable<PrivacySettings> {
    return this.http.get<ApiResponse<PrivacySettings>>(`${this.api}/settings`).pipe(map((r) => r.data));
  }

  saveSettings(body: { officerName: string | null; officerEmail: string | null; officerPhone: string | null; consentAge: number }):
    Observable<PrivacySettings> {
    return this.http.put<ApiResponse<PrivacySettings>>(`${this.api}/settings`, body).pipe(map((r) => r.data));
  }

  publish(body: string): Observable<PrivacyNotice> {
    return this.http.post<ApiResponse<PrivacyNotice>>(`${this.api}/notices`, { body }).pipe(map((r) => r.data));
  }

  notice(version: number): Observable<PrivacyNotice> {
    return this.http.get<ApiResponse<PrivacyNotice>>(`${this.api}/notices/${version}`).pipe(map((r) => r.data));
  }

  /** A patient's choices; `patientId` null means the signed-in patient's own. */
  consents(patientId: string | null): Observable<PatientConsents> {
    return this.http.get<ApiResponse<PatientConsents>>(this.consentsUrl(patientId)).pipe(map((r) => r.data));
  }

  record(patientId: string | null, request: ConsentRequest): Observable<PatientConsents> {
    return this.http.post<ApiResponse<PatientConsents>>(this.consentsUrl(patientId), request).pipe(map((r) => r.data));
  }

  private consentsUrl(patientId: string | null): string {
    return patientId ? `${this.api}/patients/${patientId}/consents` : `${this.api}/me/consents`;
  }
}

/** Whether someone born on `dateOfBirth` (yyyy-mm-dd) is under `consentAge` today. */
export function isMinor(dateOfBirth: string | null | undefined, consentAge: number): boolean {
  if (!dateOfBirth) return false;
  const born = new Date(dateOfBirth);
  if (isNaN(born.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  if (today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())) age--;
  return age < consentAge;
}
