import { TestBed } from '@angular/core/testing';
import { PaymentList } from './payment-list';
import { PaymentService } from '../../../../core/services/payment.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { PaymentResponse } from '../../../../core/models/payment.model';

describe('PaymentList', () => {
  const mockPayment: PaymentResponse = {
    id: 'p1', billId: 'b1', amountInPaisa: 150000, paymentMethod: 'UPI',
    paymentMode: 'ONLINE', paymentStatus: 'PAID', paidAt: '2026-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
  };

  const mockResponse: ApiResponse<PaymentResponse[]> = {
    success: true, data: [mockPayment], message: '', timestamp: '', requestId: '',
  };

  let component: PaymentList;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentService, useValue: { getHistory: vi.fn().mockReturnValue(of(mockResponse)), generateUpiQr: vi.fn().mockReturnValue(of({ success: true, data: 'data:image/png;base64,test' })) } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new PaymentList());
    // don't call detectChanges here; tests control when ngOnInit runs
  });

  it('should create with initial state', () => {
    expect(component).toBeTruthy();
    expect(component.payments).toEqual([]);
    expect(component.filteredPayments).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
    expect(component.statusFilter).toBe('');
    expect(component.searchQuery).toBe('');
  });

  it('should load payments on init', () => {
    component.ngOnInit();
    expect(component.payments.length).toBe(1);
    expect(component.filteredPayments.length).toBe(1);
    expect(component.payments[0].paymentMethod).toBe('UPI');
    expect(component.isLoading).toBe(false);
  });

  it('should compute totalCollected, paidCount, pendingCount', () => {
    component.ngOnInit();
    expect(component.totalCollected).toBe(150000);
    expect(component.paidCount).toBe(1);
    expect(component.pendingCount).toBe(0);
  });

  it('should handle load error', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentService, useValue: { getHistory: vi.fn().mockReturnValue(throwError(() => ({ message: 'Network error' }))) } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new PaymentList());
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Network error');
  });

  it('should handle load error without message', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentService, useValue: { getHistory: vi.fn().mockReturnValue(throwError(() => ({}))) } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new PaymentList());
    component.ngOnInit();
    expect(component.error).toBe('Failed to load payments');
  });

  it('should handle null data response', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentService, useValue: { getHistory: vi.fn().mockReturnValue(of({ success: true, data: null, message: '', timestamp: '', requestId: '' })) } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new PaymentList());
    component.ngOnInit();
    expect(component.payments).toEqual([]);
  });

  it('should format paisa to rupees with Indian locale', () => {
    expect(component.getAmount(150000)).toBe('₹1,500.00');
    expect(component.getAmount(999)).toBe('₹9.99');
    expect(component.getAmount(0)).toBe('₹0.00');
  });

  it('should filter by status', () => {
    component.ngOnInit();
    expect(component.filteredPayments.length).toBe(1);
    component.statusFilter = 'PENDING';
    component.applyFilters();
    expect(component.filteredPayments.length).toBe(0);
    component.statusFilter = 'PAID';
    component.applyFilters();
    expect(component.filteredPayments.length).toBe(1);
  });

  it('should search by bill ID and payment method', () => {
    component.ngOnInit();
    component.searchQuery = 'b1';
    component.applyFilters();
    expect(component.filteredPayments.length).toBe(1);
    component.searchQuery = 'upi';
    component.applyFilters();
    expect(component.filteredPayments.length).toBe(1);
    component.searchQuery = 'xyz';
    component.applyFilters();
    expect(component.filteredPayments.length).toBe(0);
  });

  it('should open and close detail modal', () => {
    component.ngOnInit();
    component.openDetail(component.payments[0]);
    expect(component.selectedPayment).toBe(component.payments[0]);
    component.closeDetail();
    expect(component.selectedPayment).toBeNull();
  });

  it('should generate UPI QR and show modal', () => {
    component.ngOnInit();
    component.openUpiQr();
    expect(component.showQrModal).toBe(true);
    expect(component.qrBillId).toBe('');
    component.qrBillId = 'b1';
    component.generateQr();
    expect(component.qrCode).toBe('data:image/png;base64,test');
  });
});