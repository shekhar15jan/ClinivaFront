import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { fakeAuth } from '../../testing/role-permissions';
import { StockService } from '../../core/services/stock.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { StockLine } from '../../core/models/stock.model';
import { StockPageComponent } from './stock-page';

const line = (extra: Partial<StockLine>): StockLine => ({
  medicineId: 'm1', medicineName: 'Amoxicillin', genericName: 'amoxicillin', unit: 'capsule', priceInPaisa: 500, onHand: 30,
  reorderLevel: 10, low: false, nearestExpiry: '2027-04-04', expiredQuantity: 0, unbatched: 0, ...extra,
});

describe('StockPageComponent', () => {
  let stock: Record<string, ReturnType<typeof vi.fn>>;

  function create(role: string) {
    stock = {
      overviewPage: vi.fn().mockReturnValue(of({ items: [line({}), line({ medicineId: 'm2', medicineName: 'Cetirizine', genericName: null, low: true })], page: 0, size: 100, total: 2, hasMore: false })),
      overview: vi.fn().mockReturnValue(of([line({}), line({ medicineId: 'm2', medicineName: 'Cetirizine', genericName: null, low: true })])),
      alerts: vi.fn().mockReturnValue(of({ low: [line({ low: true })], expiring: [], expired: [] })),
      suppliers: vi.fn().mockReturnValue(of([])),
      receive: vi.fn().mockReturnValue(of([])),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: StockService, useValue: stock },
        { provide: AuthService, useValue: fakeAuth(role) },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new StockPageComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('searches by brand or generic name, and counts the alerts', () => {
    const c = create('PHARMACIST');
    c.q = 'amoxi';
    c.filter();
    expect(c.shown.map((l) => l.medicineName)).toEqual(['Amoxicillin']);
    expect(c.alertCount).toBe(1);
  });

  it('shows more from the server when the list is longer than one page, and searches there too', () => {
    const c = create('PHARMACIST');
    stock['overviewPage'].mockReturnValueOnce(of({ items: [line({})], page: 0, size: 100, total: 3, hasMore: true }));
    c.load();
    expect(c.hasMore).toBe(true);
    stock['overviewPage'].mockReturnValueOnce(of({ items: [line({ medicineId: 'm9', medicineName: 'Zinc' })], page: 1, size: 100, total: 3, hasMore: false }));
    c.more();
    expect(stock['overviewPage']).toHaveBeenLastCalledWith('', 1, 100);
    expect(c.lines.length).toBe(2);
    expect(c.hasMore).toBe(false);
    stock['overviewPage'].mockReturnValueOnce(of({ items: [line({})], page: 0, size: 100, total: 3, hasMore: true }));
    c.load();
    c.q = 'amox';
    c.filter();
    expect(stock['overviewPage']).toHaveBeenLastCalledWith('amox', 0, 100);
  });

  it('a receipt needs batch, expiry, quantity and cost on every line, and is sent in paisa', () => {
    const c = create('PHARMACIST');
    c.go('receive');
    expect(c.receiptReady).toBe(false);
    c.draft[0] = { medicineId: 'm1', batchNumber: 'AB12', expiryDate: '2027-06-30', quantity: 100, cost: 2.75, mrp: null };
    expect(c.receiptReady).toBe(true);
    c.invoice = 'INV-9';
    c.receive();
    expect(stock['receive']).toHaveBeenCalledWith(null, 'INV-9', [
      { medicineId: 'm1', batchNumber: 'AB12', expiryDate: '2027-06-30', quantity: 100, costInPaisa: 275, mrpInPaisa: null },
    ]);
  });

  it('only those who manage medicines receive and count', () => {
    expect(create('NURSE').canManage).toBe(false);
    TestBed.resetTestingModule();
    expect(create('PHARMACIST').canManage).toBe(true);
  });
});
