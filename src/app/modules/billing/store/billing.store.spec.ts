import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { BillingStore } from './billing.store';
import { BillingService } from '../../../core/services/billing.service';
import { Bill, BillPreview, CreateBillRequest } from '../../../core/models/billing.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

describe('BillingStore', () => {
  let store: InstanceType<typeof BillingStore>;
  let mockBillingService: Partial<BillingService>;

  const mockBill: Bill = {
    id: 'b1',
    appointmentId: 'a1',
    patientId: 'p1',
    patientName: 'John Doe',
    consultationFeeInPaisa: 50000,
    lineItems: [],
    discountInPaisa: 0,
    taxInPaisa: 0,
    totalInPaisa: 50000,
    paidAmountInPaisa: 0,
    dueAmountInPaisa: 50000,
    status: 'UNPAID',
    createdAt: '2026-07-15T10:00:00Z',
  };

  const mockPaidBill: Bill = { ...mockBill, id: 'b2', status: 'PAID', paidAmountInPaisa: 50000, dueAmountInPaisa: 0 };

  const mockBillPreview: BillPreview = {
    consultationFeeInPaisa: 50000,
    medicineCharges: [],
    totalInPaisa: 50000,
  };

  const mockPagedResponse: ApiResponse<PagedResponse<Bill>> = {
    success: true,
    data: {
      content: [mockBill],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    },
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockBillingService = {
      getBills: vi.fn().mockReturnValue(of(mockPagedResponse)),
      getBillById: vi.fn().mockReturnValue(of({ success: true, data: mockBill, message: 'ok', timestamp: '', requestId: 'r1' })),
      getBillPreview: vi.fn().mockReturnValue(of({ success: true, data: mockBillPreview, message: 'ok', timestamp: '', requestId: 'r1' })),
      createBill: vi.fn().mockReturnValue(of({ success: true, data: mockBill, message: 'created', timestamp: '', requestId: 'r1' })),
      updateBillStatus: vi.fn().mockReturnValue(of({ success: true, data: { ...mockBill, status: 'PAID', paidAmountInPaisa: 50000, dueAmountInPaisa: 0 }, message: 'updated', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        BillingStore,
        { provide: BillingService, useValue: mockBillingService },
      ],
    });

    store = TestBed.inject(BillingStore);
  });

  it('should have initial state', () => {
    expect(store.bills()).toEqual([]);
    expect(store.selectedBill()).toBeNull();
    expect(store.billPreview()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.totalElements()).toBe(0);
    expect(store.currentPage()).toBe(0);
  });

  it('should have computed false/zero initially', () => {
    expect(store.hasBills()).toBe(false);
    expect(store.unpaidBills()).toEqual([]);
    expect(store.totalOutstanding()).toBe(0);
  });

  it('should load bills successfully', fakeAsync(() => {
    store.loadBills({ page: 0, size: 20 });
    tick();
    expect(store.bills()).toEqual([mockBill]);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.hasBills()).toBe(true);
  }));

  it('should load bills with default params', fakeAsync(() => {
    store.loadBills();
    tick();
    expect(mockBillingService.getBills).toHaveBeenCalledWith(0, 20, undefined);
  }));

  it('should handle load bills error', fakeAsync(() => {
    mockBillingService.getBills = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(BillingStore);
    errorStore.loadBills();
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should load single bill', fakeAsync(() => {
    store.loadBill('b1');
    tick();
    expect(store.selectedBill()).toEqual(mockBill);
  }));

  it('should handle load bill error', fakeAsync(() => {
    mockBillingService.getBillById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(BillingStore);
    errorStore.loadBill('b1');
    tick();
    expect(errorStore.error()).toBe('Not found');
  }));

  it('should load bill preview', fakeAsync(() => {
    store.loadBillPreview('a1');
    tick();
    expect(store.billPreview()).toEqual(mockBillPreview);
    expect(mockBillingService.getBillPreview).toHaveBeenCalledWith('a1');
  }));

  it('should handle load bill preview error', fakeAsync(() => {
    mockBillingService.getBillPreview = vi.fn().mockReturnValue(throwError(() => new Error('Preview failed')));
    const errorStore = TestBed.inject(BillingStore);
    errorStore.loadBillPreview('a1');
    tick();
    expect(errorStore.error()).toBe('Preview failed');
  }));

  it('should create bill', fakeAsync(() => {
    store.loadBills();
    tick();
    const initialCount = store.bills().length;
    const request: CreateBillRequest = { prescriptionId: 'rx1', appointmentId: 'a1', lineItems: [] };
    store.createBill(request);
    tick();
    expect(mockBillingService.createBill).toHaveBeenCalledWith('rx1', request);
    expect(store.bills().length).toBe(initialCount + 1);
    expect(store.selectedBill()).toEqual(mockBill);
    expect(store.totalElements()).toBe(initialCount + 1);
  }));

  it('should handle create bill error', fakeAsync(() => {
    mockBillingService.createBill = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(BillingStore);
    errorStore.createBill({ prescriptionId: 'rx1', appointmentId: 'a1', lineItems: [] } as CreateBillRequest);
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should update bill status', fakeAsync(() => {
    store.loadBills();
    tick();
    store.updateBillStatus({ id: 'b1', status: 'PAID', paidAmount: 50000 });
    tick();
    expect(mockBillingService.updateBillStatus).toHaveBeenCalledWith('b1', 'PAID', 50000);
    expect(store.bills()[0].status).toBe('PAID');
  }));

  it('should handle update bill status error', fakeAsync(() => {
    mockBillingService.updateBillStatus = vi.fn().mockReturnValue(throwError(() => new Error('Update failed')));
    const errorStore = TestBed.inject(BillingStore);
    errorStore.updateBillStatus({ id: 'b1', status: 'PAID' });
    tick();
    expect(errorStore.error()).toBe('Update failed');
  }));

  it('should compute unpaidBills and totalOutstanding', fakeAsync(() => {
    mockBillingService.getBills = vi.fn().mockReturnValue(of({
      ...mockPagedResponse,
      data: { ...mockPagedResponse.data, content: [mockBill, mockPaidBill], totalElements: 2 },
    }));
    store.loadBills();
    tick();
    expect(store.unpaidBills()).toEqual([mockBill]);
    expect(store.totalOutstanding()).toBe(50000);
  }));

  it('should update selectedBill after status update', fakeAsync(() => {
    store.loadBill('b1');
    tick();
    store.updateBillStatus({ id: 'b1', status: 'PAID', paidAmount: 50000 });
    tick();
    expect(store.selectedBill()?.status).toBe('PAID');
  }));

  it('should clear selected bill and preview', () => {
    store.clearSelectedBill();
    expect(store.selectedBill()).toBeNull();
    expect(store.billPreview()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
