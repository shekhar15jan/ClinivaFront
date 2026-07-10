import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import {
  CreateOrderRequest, CreateOrderResponse,
  VerifyPaymentRequest, SavePaymentRequest, PaymentResponse
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

  generateUpiQr(billId: string): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.baseUrl}/generate-upi-qr`, {
      params: { billId },
    });
  }

  getHistory(): Observable<ApiResponse<PaymentResponse[]>> {
    return this.http.get<ApiResponse<PaymentResponse[]>>(`${this.baseUrl}/history`);
  }
}
