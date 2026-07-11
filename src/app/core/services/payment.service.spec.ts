import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, SavePaymentRequest, PaymentResponse } from '../models/payment.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/payments`;

  const mockPayment: PaymentResponse = {
    id: 'p1', billId: 'b1', amountInPaisa: 150000, paymentMethod: 'UPI',
    paymentMode: 'ONLINE', paymentStatus: 'SUCCESS', paidAt: '2026-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('createOrder', () => {
    it('should POST create-order', () => {
      const request: CreateOrderRequest = { billId: 'b1', amountInPaisa: 150000 };
      const orderResp: CreateOrderResponse = { razorpayOrderId: 'order_123', razorpayKeyId: 'rzp_test_key', amountInPaisa: 150000, currency: 'INR', billId: 'b1' };
      const apiResp: ApiResponse<CreateOrderResponse> = { success: true, data: orderResp, message: '', timestamp: '', requestId: '' };

      service.createOrder(request).subscribe((res) => {
        expect(res.data?.razorpayOrderId).toBe('order_123');
      });

      const req = httpMock.expectOne(`${baseUrl}/create-order`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('verifyPayment', () => {
    it('should POST verify', () => {
      const request: VerifyPaymentRequest = { razorpayOrderId: 'order_123', razorpayPaymentId: 'pay_456', razorpaySignature: 'sig_789' };
      const apiResp: ApiResponse<void> = { success: true, data: undefined, message: '', timestamp: '', requestId: '' };

      service.verifyPayment(request).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/verify`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('savePayment', () => {
    it('should POST save', () => {
      const request: SavePaymentRequest = { billId: 'b1', amountInPaisa: 150000, paymentMethod: 'CASH', paymentMode: 'OFFLINE' };
      const apiResp: ApiResponse<PaymentResponse> = { success: true, data: mockPayment, message: '', timestamp: '', requestId: '' };

      service.savePayment(request).subscribe((res) => {
        expect(res.data?.paymentMethod).toBe('UPI');
      });

      const req = httpMock.expectOne(`${baseUrl}/save`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('generateUpiQr', () => {
    it('should GET with billId param', () => {
      const apiResp: ApiResponse<string> = { success: true, data: 'upi://pay?pa=...', message: '', timestamp: '', requestId: '' };

      service.generateUpiQr('b1').subscribe((res) => {
        expect(res.data).toBe('upi://pay?pa=...');
      });

      const req = httpMock.expectOne(`${baseUrl}/generate-upi-qr?billId=b1`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('getHistory', () => {
    it('should GET history', () => {
      const apiResp: ApiResponse<PaymentResponse[]> = { success: true, data: [mockPayment], message: '', timestamp: '', requestId: '' };

      service.getHistory().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/history`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });
});
