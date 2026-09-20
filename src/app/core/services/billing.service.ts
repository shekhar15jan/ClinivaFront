import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { Bill, CreateBillRequest, UpdateBillRequest } from '../models/billing.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/bills`;

  getBills(
    page?: number,
    size?: number,
    status?: string,
  ): Observable<ApiResponse<PagedResponse<Bill>>> {
    let params = new HttpParams();
    if (page !== undefined) params = params.set('page', page);
    if (size !== undefined) params = params.set('size', size);
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<RawPagedResponse<Bill>>>(this.baseUrl, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: PagedResponse.from(response.data),
        })),
      );
  }

  getBillById(id: string): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.baseUrl}/${id}`);
  }

  createBill(prescriptionId: string, request: CreateBillRequest): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(`${this.baseUrl}/generate?prescriptionId=${prescriptionId}`, request);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/invoice`, { responseType: 'blob' });
  }

  updateBill(id: string, request: UpdateBillRequest): Observable<ApiResponse<Bill>> {
    return this.http.put<ApiResponse<Bill>>(`${this.baseUrl}/${id}`, request);
  }

  voidBill(id: string, reason: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`, {
      params: { reason },
    });
  }

  /** The signed-in patient's bills. The server works out who that is; no id is sent. */
  getPatientBills(): Observable<ApiResponse<Bill[]>> {
    return this.http.get<ApiResponse<Bill[]>>(`${this.baseUrl}/patient/logged-in`);
  }
}
