import { TestBed } from '@angular/core/testing';
import { PaymentList } from './payment-list';
import { PaymentService } from '../../../../core/services/payment.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PaymentResponse, PaymentSummary } from '../../../../core/models/payment.model';

describe('PaymentList', () => {
  const mockPayment: PaymentResponse = {
    id: 'p1', billId: 'b1', amountInPaisa: 150000, paymentMethod: 'UPI', paymentMode: 'ONLINE',
    paymentStatus: 'SUCCESS', paidAt: '2026-01-01T00:00:00Z', createdAt: '2026-01-01T00:00:00Z',
    billNumber: 'BILL-2026-0042', patientName: 'Rahul Rao',
  };
  const pageOf = (content: PaymentResponse[], pageNumber = 0, totalElements = content.length, totalPages = 1) => ({
    success: true, message: '', timestamp: '', requestId: '',
    data: { content, pageNumber, pageSize: 20, totalElements, totalPages, last: pageNumber >= totalPages - 1 },
  });
  const summary: PaymentSummary = { collectedInPaisa: 3_250_000_00, successful: 25000, pendingOrFailed: 12, total: 25012 };

  let service: { getPage: ReturnType<typeof vi.fn>; getSummary: ReturnType<typeof vi.fn> };

  function create(overrides: Partial<typeof service> = {}): PaymentList {
    service = {
      getPage: vi.fn().mockReturnValue(of(pageOf([mockPayment], 0, 25012, 1251))),
      getSummary: vi.fn().mockReturnValue(of({ success: true, data: summary, message: '', timestamp: '', requestId: '' })),
      ...overrides,
    };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PaymentService, useValue: service }] });
    return TestBed.runInInjectionContext(() => new PaymentList());
  }

  it('starts empty and loads the first page with the clinic-wide totals', () => {
    const component = create();
    expect(component.payments).toEqual([]);
    component.ngOnInit();
    expect(service.getPage).toHaveBeenCalledWith({ page: 0, size: 20, status: '', q: '' });
    expect(component.payments).toEqual([mockPayment]);
    expect(component.totalElements).toBe(25012);
    // Totals are over all payments (received ones are SUCCESS), not the page on screen.
    expect(component.summary).toEqual(summary);
    expect(component.isLoading).toBe(false);
  });

  it('filters by status on the server, from the first page', () => {
    const component = create();
    component.ngOnInit();
    component.goToPage(3);
    component.statusFilter = 'SUCCESS';
    component.onFilterChange();
    expect(service.getPage).toHaveBeenLastCalledWith({ page: 0, size: 20, status: 'SUCCESS', q: '' });
  });

  it('searches by patient or bill number on the server once typing pauses', () => {
    vi.useFakeTimers();
    try {
      const component = create();
      component.ngOnInit();
      component.searchQuery = 'BILL-2026';
      component.onSearchInput();
      expect(service.getPage).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(300);
      expect(service.getPage).toHaveBeenLastCalledWith({ page: 0, size: 20, status: '', q: 'BILL-2026' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('pages within range only', () => {
    const component = create();
    component.ngOnInit();
    component.goToPage(1);
    expect(service.getPage).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    service.getPage.mockClear();
    component.goToPage(-1);
    component.goToPage(99999);
    expect(service.getPage).not.toHaveBeenCalled();
  });

  it('says why the payments could not load', () => {
    const component = create({ getPage: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Module is not active: PAYMENT' } }))) });
    component.ngOnInit();
    expect(component.error).toBe('Module is not active: PAYMENT');
    expect(component.isLoading).toBe(false);
  });

  it('names statuses plainly and formats amounts in rupees', () => {
    const component = create();
    expect(component.statusLabel('SUCCESS')).toBe('Received');
    expect(component.statusLabel('FAILED')).toBe('Failed');
    expect(component.getAmount(150000)).toBe('₹1,500.00');
  });

  it('opens and closes a payment', () => {
    const component = create();
    component.openDetail(mockPayment);
    expect(component.selectedPayment).toBe(mockPayment);
    component.closeDetail();
    expect(component.selectedPayment).toBeNull();
  });
});
