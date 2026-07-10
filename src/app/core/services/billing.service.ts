import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { Bill, BillPreview, CreateBillRequest } from '../models/billing.model';
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
    return this.http.get<ApiResponse<PagedResponse<Bill>>>(this.baseUrl, { params });
  }

  getBillById(id: string): Observable<ApiResponse<Bill>> {
    return this.http.get<ApiResponse<Bill>>(`${this.baseUrl}/${id}`);
  }

  getBillPreview(prescriptionId: string): Observable<ApiResponse<BillPreview>> {
    return this.http.get<ApiResponse<BillPreview>>(`${this.baseUrl}/preview`, {
      params: { prescriptionId },
    });
  }

  createBill(prescriptionId: string, request: CreateBillRequest): Observable<ApiResponse<Bill>> {
    return this.http.post<ApiResponse<Bill>>(`${this.baseUrl}/generate?prescriptionId=${prescriptionId}`, request);
  }

  downloadPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/invoice`, { responseType: 'blob' });
  }

  updateBillStatus(id: string, status: string, paidAmount?: number): Observable<ApiResponse<Bill>> {
    const body: { status: string; paidAmount?: number } = { status };
    if (paidAmount !== undefined) body.paidAmount = paidAmount;
    return this.http.put<ApiResponse<Bill>>(`${this.baseUrl}/${id}`, body);
  }

  voidBill(id: string, reason: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`, { body: { reason } });
  }

  getPatientBills(patientId: string): Observable<ApiResponse<Bill[]>> {
    return this.http.get<ApiResponse<Bill[]>>(`${this.baseUrl}/patient/logged-in`, {
      params: { patientId },
    });
  }
}
