import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import {
  CreateOrderRequest, CreateOrderResponse,
  VerifyPaymentRequest, SavePaymentRequest, PaymentResponse, PaymentSummary
} from '../models/payment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/payments`;

  createOrder(request: CreateOrderRequest): Observable<ApiResponse<CreateOrderResponse>> {
    return this.http.post<ApiResponse<CreateOrderResponse>>(`${this.baseUrl}/create-order`, request);
  }

  verifyPayment(request: VerifyPaymentRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.baseUrl}/verify`, request);
  }

  savePayment(request: SavePaymentRequest): Observable<ApiResponse<PaymentResponse>> {
    return this.http.post<ApiResponse<PaymentResponse>>(`${this.baseUrl}/save`, request);
  }

  /** Whether this clinic takes online (Razorpay) payments. */
  onlineAvailable(): Observable<ApiResponse<{ available: boolean }>> {
    return this.http.get<ApiResponse<{ available: boolean }>>(`${this.baseUrl}/online-available`);
  }

  generateUpiQr(billId: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.baseUrl}/generate-upi-qr`, {
      params: { billId },
    });
  }

  /** One page of payments, newest first; status and search (bill number, patient name or id) run on the server. */
  getPage(query: { page?: number; size?: number; status?: string; q?: string } = {}):
    Observable<ApiResponse<PagedResponse<PaymentResponse>>> {
    const params: Record<string, string | number> = { page: query.page ?? 0, size: query.size ?? 20, sort: 'createdAt,desc' };
    if (query.status) params['status'] = query.status;
    if (query.q?.trim()) params['q'] = query.q.trim();
    return this.http
      .get<ApiResponse<RawPagedResponse<PaymentResponse>>>(`${this.baseUrl}/history`, { params })
      .pipe(map((res) => ({ ...res, data: PagedResponse.from(res.data ?? { content: [] }) })));
  }

  /** Received total and counts across all of the clinic's payments. */
  getSummary(): Observable<ApiResponse<PaymentSummary>> {
    return this.http.get<ApiResponse<PaymentSummary>>(`${this.baseUrl}/summary`);
  }

  /**
   * The payment list, newest first. The backend answers with a page ({ content, page }), not a bare
   * array, so the rows are unwrapped here. The screen filters and totals in the browser, which is why
   * it asks for a large page; a clinic with more payments than that will need server-side paging.
   */
  getHistory(size = 200): Observable<ApiResponse<PaymentResponse[]>> {
    return this.http
      .get<ApiResponse<RawPagedResponse<PaymentResponse>>>(`${this.baseUrl}/history`, {
        params: { page: 0, size, sort: 'createdAt,desc' },
      })
      .pipe(map((res) => ({ ...res, data: PagedResponse.from(res.data ?? { content: [] }).content })));
  }
}
