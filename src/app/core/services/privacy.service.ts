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

export type DataRequestType = 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'OBJECTION' | 'GRIEVANCE' | 'NOMINATION' | 'OTHER';
export type DataRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'REFUSED';
export type DataRequestSource = 'PORTAL' | 'DESK' | 'EMAIL' | 'POST';

export const REQUEST_TYPES: { code: DataRequestType; label: string }[] = [
  { code: 'ACCESS', label: 'See or get a copy of my data' },
  { code: 'CORRECTION', label: 'Correct something wrong' },
  { code: 'ERASURE', label: 'Delete data no longer needed' },
  { code: 'OBJECTION', label: 'Stop a use of my data' },
  { code: 'GRIEVANCE', label: 'A complaint about my data' },
  { code: 'NOMINATION', label: 'Name someone to act for me' },
  { code: 'OTHER', label: 'Something else' },
];

export interface DataRequest {
  id: string;
  patientId: string | null;
  type: DataRequestType;
  source: DataRequestSource;
  requesterName: string;
  requesterContact: string | null;
  details: string | null;
  status: DataRequestStatus;
  response: string | null;
  receivedAt: string;
  dueAt: string;
  closedAt: string | null;
  overdue: boolean;
}

export interface NewDataRequest {
  type: DataRequestType;
  details?: string | null;
  patientId?: string | null;
  requesterName?: string | null;
  requesterContact?: string | null;
  source?: DataRequestSource;
}

export interface DuePatient { patientId: string; patientCode: string; name: string; lastActivity: string; keepUntil: string }
export interface RetentionPolicy { retentionYears: number; autoAnonymise: boolean; dueShown: number; due: DuePatient[] }
export interface PatientRetention {
  lastActivity: string;
  keepUntil: string;
  hasRecords: boolean;
  legalHold: boolean;
  legalHoldReason: string | null;
  anonymisedAt: string | null;
  eligible: boolean;
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

  /** Requests about data: all the clinic's (the privacy officer), or the signed-in patient's own (`mine`). */
  requests(mine: boolean, openOnly = false): Observable<DataRequest[]> {
    const url = mine ? `${this.api}/me/requests` : `${this.api}/requests?openOnly=${openOnly}`;
    return this.http.get<ApiResponse<DataRequest[]>>(url).pipe(map((r) => r.data));
  }

  makeRequest(mine: boolean, request: NewDataRequest): Observable<DataRequest> {
    return this.http.post<ApiResponse<DataRequest>>(mine ? `${this.api}/me/requests` : `${this.api}/requests`, request)
      .pipe(map((r) => r.data));
  }

  updateRequest(id: string, body: { status: DataRequestStatus; response?: string | null; patientId?: string | null }):
    Observable<DataRequest> {
    return this.http.put<ApiResponse<DataRequest>>(`${this.api}/requests/${id}`, body).pipe(map((r) => r.data));
  }

  retention(): Observable<RetentionPolicy> {
    return this.http.get<ApiResponse<RetentionPolicy>>(`${this.api}/retention`).pipe(map((r) => r.data));
  }

  saveRetention(retentionYears: number, autoAnonymise: boolean): Observable<RetentionPolicy> {
    return this.http.put<ApiResponse<RetentionPolicy>>(`${this.api}/retention`, { retentionYears, autoAnonymise }).pipe(map((r) => r.data));
  }

  runRetention(): Observable<{ anonymised: number }> {
    return this.http.post<ApiResponse<{ anonymised: number }>>(`${this.api}/retention/run`, {}).pipe(map((r) => r.data));
  }

  patientRetention(patientId: string): Observable<PatientRetention> {
    return this.http.get<ApiResponse<PatientRetention>>(`${this.api}/patients/${patientId}/retention`).pipe(map((r) => r.data));
  }

  setHold(patientId: string, hold: boolean, reason: string | null): Observable<PatientRetention> {
    return this.http.put<ApiResponse<PatientRetention>>(`${this.api}/patients/${patientId}/hold`, { hold, reason }).pipe(map((r) => r.data));
  }

  anonymise(patientId: string, reason: string | null): Observable<PatientRetention> {
    return this.http.post<ApiResponse<PatientRetention>>(`${this.api}/patients/${patientId}/anonymise`, { reason }).pipe(map((r) => r.data));
  }

  /** Saves a patient's data as a JSON file; `patientId` null is the signed-in patient's own. */
  downloadExport(patientId: string | null): Observable<void> {
    const url = patientId ? `${this.api}/patients/${patientId}/export` : `${this.api}/me/export`;
    return this.http.get(url, { responseType: 'blob' }).pipe(map((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = patientId ? `patient-data-${patientId}.json` : 'my-health-data.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    }));
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
