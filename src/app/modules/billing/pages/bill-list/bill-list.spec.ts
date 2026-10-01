import { TestBed } from '@angular/core/testing';
import { BillList } from './bill-list';
import { BillingService } from '../../../../core/services/billing.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('BillList', () => {
  function createComponent(overrides?: Partial<BillingService>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: BillingService,
          useValue: {
            getBills: vi.fn().mockReturnValue(of({
              success: true,
              data: { content: [], pageNumber: 0, pageSize: 50, totalElements: 0, totalPages: 0, last: true },
            })),
            ...overrides,
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new BillList());
  }

  it('should create with initial empty bills', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.bills).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should load bills from API on init', () => {
    const mockBills = [
      { id: 'b-001', appointmentId: 'a1', patient: { id: '1', fullName: 'Rahul Sharma' }, consultationFeeInPaisa: 0, discountInPaisa: 0, taxInPaisa: 0, totalAmountInPaisa: 0, paymentStatus: 'PAID' as const, createdAt: '' },
    ];
    const component = createComponent({
      getBills: vi.fn().mockReturnValue(of({
        success: true,
        data: { content: mockBills, pageNumber: 0, pageSize: 50, totalElements: 1, totalPages: 1, last: true },
      })),
    });
    component.ngOnInit();
    expect(component.bills.length).toBe(1);
    expect(component.bills[0].patient?.fullName).toBe('Rahul Sharma');
  });

  it('should return correct status CSS class', () => {
    const component = createComponent();
    expect(component.statusClass('PAID')).toContain('text-[#059669]');
    expect(component.statusClass('UNPAID')).toContain('text-[#DC2626]');
    expect(component.statusClass('PARTIALLY_PAID')).toContain('text-[#CA8A04]');
    expect(component.statusClass('UNKNOWN')).toContain('text-[#64748B]');
  });

  describe('at clinic scale', () => {
    const bill = { id: 'b1', billNumber: 'BILL-2026-0042', appointmentId: 'a1', patient: { id: '1', fullName: 'Rahul Rao' },
      consultationFeeInPaisa: 0, discountInPaisa: 0, taxInPaisa: 0, totalAmountInPaisa: 50000, amountPaidInPaisa: 20000,
      paymentStatus: 'PARTIALLY_PAID' as const, createdAt: '' };
    const page = (pageNumber = 0) => of({ success: true, message: '', timestamp: '', requestId: '',
      data: { content: [bill], pageNumber, pageSize: 20, totalElements: 30000, totalPages: 1500, last: false } });

    it('asks the server for status, search and page (they were ignored), and shows what is still due', () => {
      vi.useFakeTimers();
      try {
        const getBills = vi.fn().mockImplementation((p: number) => page(p));
        const component = createComponent({ getBills } as unknown as Partial<BillingService>);
        component.ngOnInit();
        expect(getBills).toHaveBeenLastCalledWith(0, 20, undefined, '');
        expect(component.totalElements).toBe(30000);
        expect(component.due(bill)).toBe(30000);

        component.statusFilter = 'UNPAID';
        component.loadBills(0);
        expect(getBills).toHaveBeenLastCalledWith(0, 20, 'UNPAID', '');

        component.searchQuery = 'Rao';
        component.onSearch();
        vi.advanceTimersByTime(300);
        expect(getBills).toHaveBeenLastCalledWith(0, 20, 'UNPAID', 'Rao');

        component.goToPage(2);
        expect(getBills).toHaveBeenLastCalledWith(2, 20, 'UNPAID', 'Rao');
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
