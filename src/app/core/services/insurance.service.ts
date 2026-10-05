import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { Claim, ClaimSummary, Payer, PayerKind, Policy, PolicyRequest, Receivables, Step } from '../models/insurance.model';
import { environment } from '../../../environments/environment';

/** The insurance desk: payers, policies and cashless claims. */
@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/insurance`;

  payers(): Observable<Payer[]> {
    return this.http.get<ApiResponse<Payer[]>>(`${this.api}/payers`).pipe(map((r) => r.data ?? []));
  }

  addPayer(name: string, kind: PayerKind): Observable<Payer> {
    return this.http.post<ApiResponse<Payer>>(`${this.api}/payers`, { name, kind }).pipe(map((r) => r.data));
  }

  addCommonPayers(): Observable<Payer[]> {
    return this.http.post<ApiResponse<Payer[]>>(`${this.api}/payers/common`, {}).pipe(map((r) => r.data ?? []));
  }

  policies(patientId: string): Observable<Policy[]> {
    return this.http.get<ApiResponse<Policy[]>>(`${this.api}/policies/patient/${patientId}`).pipe(map((r) => r.data ?? []));
  }

  addPolicy(request: PolicyRequest): Observable<Policy> {
    return this.http.post<ApiResponse<Policy>>(`${this.api}/policies`, request).pipe(map((r) => r.data));
  }

  claims(stage: string, page = 0, size = 20): Observable<PagedResponse<ClaimSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (stage) params = params.set('stage', stage);
    return this.http.get<ApiResponse<RawPagedResponse<ClaimSummary>>>(`${this.api}/claims`, { params }).pipe(map((r) => PagedResponse.from(r.data)));
  }

  receivables(): Observable<Receivables> {
    return this.http.get<ApiResponse<Receivables>>(`${this.api}/receivables`).pipe(map((r) => r.data));
  }

  forAdmission(admissionId: string): Observable<ClaimSummary[]> {
    return this.http.get<ApiResponse<ClaimSummary[]>>(`${this.api}/claims/admission/${admissionId}`).pipe(map((r) => r.data ?? []));
  }

  get(id: string): Observable<Claim> {
    return this.http.get<ApiResponse<Claim>>(`${this.api}/claims/${id}`).pipe(map((r) => r.data));
  }

  open(admissionId: string, policyId: string, packageCode: string | null, packageName: string | null,
       requestedInPaisa: number | null): Observable<Claim> {
    return this.http
      .post<ApiResponse<Claim>>(`${this.api}/claims`, { admissionId, policyId, packageCode, packageName, requestedInPaisa })
      .pipe(map((r) => r.data));
  }

  step(id: string, step: Step, amountInPaisa: number | null, tdsInPaisa: number | null, reference: string | null,
       note: string | null): Observable<Claim> {
    return this.http
      .post<ApiResponse<Claim>>(`${this.api}/claims/${id}/steps`, { step, amountInPaisa, tdsInPaisa, reference, note })
      .pipe(map((r) => r.data));
  }
}
