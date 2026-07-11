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
    paymentMode: 'ONLINE', paymentStatus: 'SUCCESS', paidAt: '2026-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
  };

  const mockResponse: ApiResponse<PaymentResponse[]> = {
    success: true, data: [mockPayment], message: '', timestamp: '', requestId: '',
  };

  function createComponent(overrides?: Partial<PaymentService>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: PaymentService, useValue: { getHistory: vi.fn().mockReturnValue(of(mockResponse)), ...overrides } },
      ],
    });
    return TestBed.runInInjectionContext(() => new PaymentList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.payments).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
  });

  it('should load payments on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.payments.length).toBe(1);
    expect(component.payments[0].paymentMethod).toBe('UPI');
    expect(component.isLoading).toBe(false);
  });

  it('should handle load error', () => {
    const component = createComponent({
      getHistory: vi.fn().mockReturnValue(throwError(() => ({ message: 'Network error' }))),
    });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Network error');
  });

  it('should handle load error without message', () => {
    const component = createComponent({
      getHistory: vi.fn().mockReturnValue(throwError(() => ({}))),
    });
    component.ngOnInit();
    expect(component.error).toBe('Failed to load payments');
  });

  it('should handle null data response', () => {
    const component = createComponent({
      getHistory: vi.fn().mockReturnValue(of({ success: true, data: null, message: '', timestamp: '', requestId: '' })),
    });
    component.ngOnInit();
    expect(component.payments).toEqual([]);
  });

  it('should format paisa to rupees correctly', () => {
    const component = createComponent();
    expect(component.getAmount(150000)).toBe('₹1500.00');
    expect(component.getAmount(999)).toBe('₹9.99');
  });
});
