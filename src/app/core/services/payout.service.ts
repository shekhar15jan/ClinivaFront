import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

/** Money in paisa; shares and TDS in basis points (1000 = 10%). */
export type PayoutSource = 'CONSULTATION' | 'IPD_VISIT' | 'SURGERY' | 'ANAESTHESIA';
export type PayoutMode = 'FIXED' | 'PERCENT';
export type StatementStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

export const PAYOUT_SOURCES: { value: PayoutSource; label: string }[] = [
  { value: 'CONSULTATION', label: 'Consultations (paid bills)' },
  { value: 'IPD_VISIT', label: 'Inpatient visits' },
  { value: 'SURGERY', label: 'Surgeries as surgeon' },
  { value: 'ANAESTHESIA', label: 'Anaesthesia' },
];

export interface RuleView {
  source: PayoutSource;
  mode: PayoutMode;
  fixedInPaisa: number;
  percentBasisPoints: number;
  basis: string;
}

export interface DoctorRules {
  doctorId: string;
  doctorName: string;
  rules: RuleView[];
}

export interface PayoutLineView {
  id: string;
  source: PayoutSource | 'MANUAL';
  referenceId: string | null;
  occurredOn: string;
  description: string;
  baseInPaisa: number;
  amountInPaisa: number;
  basis: string | null;
}

export interface StatementView {
  id: string;
  statementNumber: string;
  doctorId: string;
  doctorName: string | null;
  registrationNumber: string | null;
  periodFrom: string;
  periodTo: string;
  status: StatementStatus;
  grossInPaisa: number;
  tdsBasisPoints: number;
  tdsInPaisa: number;
  netInPaisa: number;
  approvedAt: string | null;
  approvedBy: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  cancelReason: string | null;
  createdAt: string;
  lines: PayoutLineView[];
}

export interface StatementSummary {
  id: string;
  statementNumber: string;
  doctorId: string;
  doctorName: string | null;
  periodFrom: string;
  periodTo: string;
  status: StatementStatus;
  grossInPaisa: number;
  netInPaisa: number;
  createdAt: string;
}

/** Doctor payouts: rules, statements, approval and payment; a doctor's own statements. */
@Injectable({ providedIn: 'root' })
export class PayoutService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/payouts`;

  rules(): Observable<DoctorRules[]> {
    return this.http.get<ApiResponse<DoctorRules[]>>(`${this.api}/rules`).pipe(map((r) => r.data ?? []));
  }

  setRules(doctorId: string, rules: { source: PayoutSource; mode: PayoutMode; fixedInPaisa?: number; percentBasisPoints?: number }[]):
    Observable<DoctorRules> {
    return this.http.put<ApiResponse<DoctorRules>>(`${this.api}/rules/${doctorId}`, { rules }).pipe(map((r) => r.data));
  }

  generate(doctorId: string, from: string, to: string): Observable<StatementView> {
    return this.http.post<ApiResponse<StatementView>>(`${this.api}/statements`, { doctorId, from, to }).pipe(map((r) => r.data));
  }

  list(status: StatementStatus | '', page = 0, size = 20): Observable<PagedResponse<StatementSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<RawPagedResponse<StatementSummary>>>(`${this.api}/statements`, { params })
      .pipe(map((r) => PagedResponse.from(r.data)));
  }

  get(id: string): Observable<StatementView> {
    return this.http.get<ApiResponse<StatementView>>(`${this.api}/statements/${id}`).pipe(map((r) => r.data));
  }

  addLine(id: string, description: string, amountInPaisa: number): Observable<StatementView> {
    return this.http.post<ApiResponse<StatementView>>(`${this.api}/statements/${id}/lines`, { description, amountInPaisa }).pipe(map((r) => r.data));
  }

  removeLine(id: string, lineId: string): Observable<StatementView> {
    return this.http.delete<ApiResponse<StatementView>>(`${this.api}/statements/${id}/lines/${lineId}`).pipe(map((r) => r.data));
  }

  setTds(id: string, tdsBasisPoints: number): Observable<StatementView> {
    return this.http.put<ApiResponse<StatementView>>(`${this.api}/statements/${id}/tds`, { tdsBasisPoints }).pipe(map((r) => r.data));
  }

  approve(id: string): Observable<StatementView> {
    return this.http.post<ApiResponse<StatementView>>(`${this.api}/statements/${id}/approve`, {}).pipe(map((r) => r.data));
  }

  pay(id: string, method: string, reference: string | null): Observable<StatementView> {
    return this.http.post<ApiResponse<StatementView>>(`${this.api}/statements/${id}/pay`, { method, reference }).pipe(map((r) => r.data));
  }

  cancel(id: string, reason: string): Observable<StatementView> {
    return this.http.post<ApiResponse<StatementView>>(`${this.api}/statements/${id}/cancel`, { reason }).pipe(map((r) => r.data));
  }

  pdf(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/statements/${id}/pdf`, { responseType: 'blob' });
  }

  exportCsv(from: string, to: string): Observable<Blob> {
    return this.http.get(`${this.api}/statements/export`, { params: { from, to }, responseType: 'blob' });
  }

  mine(page = 0): Observable<PagedResponse<StatementSummary>> {
    return this.http.get<ApiResponse<RawPagedResponse<StatementSummary>>>(`${this.api}/mine`, { params: { page, size: 50 } })
      .pipe(map((r) => PagedResponse.from(r.data)));
  }

  minePdf(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/mine/${id}/pdf`, { responseType: 'blob' });
  }
}
