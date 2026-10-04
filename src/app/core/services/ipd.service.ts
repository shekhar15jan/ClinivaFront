import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import {
  AdmissionSummary,
  AdmissionView,
  AdmitRequest,
  BedBoard,
  BedStatus,
  BedView,
  ChargeRequest,
  DepositRequest,
  DischargeSummaryRequest,
  WardRequest,
  WardView,
} from '../models/ipd.model';
import { environment } from '../../../environments/environment';

/** Inpatients: the bed board, ward set-up, and an admission from admit to discharge. */
@Injectable({ providedIn: 'root' })
export class IpdService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/ipd`;

  board(): Observable<BedBoard> {
    return this.http.get<ApiResponse<BedBoard>>(`${this.api}/board`).pipe(map((r) => r.data));
  }

  createWard(request: WardRequest): Observable<WardView> {
    return this.http.post<ApiResponse<WardView>>(`${this.api}/wards`, request).pipe(map((r) => r.data));
  }

  updateWard(id: string, request: WardRequest): Observable<WardView> {
    return this.http.put<ApiResponse<WardView>>(`${this.api}/wards/${id}`, request).pipe(map((r) => r.data));
  }

  closeWard(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/wards/${id}`).pipe(map(() => void 0));
  }

  addBeds(wardId: string, bedNumbers: string[]): Observable<WardView> {
    return this.http.post<ApiResponse<WardView>>(`${this.api}/wards/${wardId}/beds`, { bedNumbers }).pipe(map((r) => r.data));
  }

  updateBed(bedId: string, change: { bedNumber?: string; status?: BedStatus; notes?: string }): Observable<BedView> {
    return this.http.put<ApiResponse<BedView>>(`${this.api}/beds/${bedId}`, change).pipe(map((r) => r.data));
  }

  removeBed(bedId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/beds/${bedId}`).pipe(map(() => void 0));
  }

  /** stage: current, advised, discharged; all when empty. */
  admissions(stage: string, q: string, page = 0, size = 20): Observable<PagedResponse<AdmissionSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (stage) params = params.set('stage', stage);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http
      .get<ApiResponse<RawPagedResponse<AdmissionSummary>>>(`${this.api}/admissions`, { params })
      .pipe(map((r) => PagedResponse.from(r.data)));
  }

  forPatient(patientId: string): Observable<AdmissionSummary[]> {
    return this.http
      .get<ApiResponse<AdmissionSummary[]>>(`${this.api}/admissions/patient/${patientId}`)
      .pipe(map((r) => r.data ?? []));
  }

  get(id: string): Observable<AdmissionView> {
    return this.http.get<ApiResponse<AdmissionView>>(`${this.api}/admissions/${id}`).pipe(map((r) => r.data));
  }

  admit(request: AdmitRequest): Observable<AdmissionView> {
    return this.http.post<ApiResponse<AdmissionView>>(`${this.api}/admissions`, request).pipe(map((r) => r.data));
  }

  transfer(id: string, bedId: string, reason: string): Observable<AdmissionView> {
    return this.post(`${id}/transfer`, { bedId, reason });
  }

  addCharge(id: string, request: ChargeRequest): Observable<AdmissionView> {
    return this.post(`${id}/charges`, request);
  }

  removeCharge(id: string, chargeId: string): Observable<AdmissionView> {
    return this.http
      .delete<ApiResponse<AdmissionView>>(`${this.api}/admissions/${id}/charges/${chargeId}`)
      .pipe(map((r) => r.data));
  }

  deposit(id: string, request: DepositRequest): Observable<AdmissionView> {
    return this.post(`${id}/deposits`, request);
  }

  refund(id: string, request: DepositRequest): Observable<AdmissionView> {
    return this.post(`${id}/refunds`, request);
  }

  writeSummary(id: string, request: DischargeSummaryRequest): Observable<AdmissionView> {
    return this.http
      .put<ApiResponse<AdmissionView>>(`${this.api}/admissions/${id}/discharge-summary`, request)
      .pipe(map((r) => r.data));
  }

  finalBill(id: string, discountInPaisa: number): Observable<AdmissionView> {
    return this.post(`${id}/final-bill`, { discountInPaisa });
  }

  cancelFinalBill(id: string): Observable<AdmissionView> {
    return this.http.delete<ApiResponse<AdmissionView>>(`${this.api}/admissions/${id}/final-bill`).pipe(map((r) => r.data));
  }

  discharge(id: string, duesNote: string | null): Observable<AdmissionView> {
    return this.post(`${id}/discharge`, { duesNote });
  }

  summaryPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/admissions/${id}/discharge-summary/pdf`, { responseType: 'blob' });
  }

  private post(path: string, body: unknown): Observable<AdmissionView> {
    return this.http.post<ApiResponse<AdmissionView>>(`${this.api}/admissions/${path}`, body).pipe(map((r) => r.data));
  }
}
