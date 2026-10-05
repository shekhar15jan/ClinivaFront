import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DoctorRules, PayoutService, StatementView } from '../../core/services/payout.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PayoutsPageComponent } from './payouts-page';
import { PayoutStatementComponent } from './payout-statement';

const doctor: DoctorRules = {
  doctorId: 'd1', doctorName: 'Anita',
  rules: [{ source: 'CONSULTATION', mode: 'PERCENT', fixedInPaisa: 0, percentBasisPoints: 5000, basis: '50% of fee' }],
};

const statement: StatementView = {
  id: 's1', statementNumber: 'PAY-202610-001', doctorId: 'd1', doctorName: 'Anita', registrationNumber: 'MMC-1',
  periodFrom: '2026-09-01', periodTo: '2026-09-30', status: 'DRAFT', grossInPaisa: 100000, tdsBasisPoints: 1000, tdsInPaisa: 10000,
  netInPaisa: 90000, approvedAt: null, approvedBy: null, paidAt: null, paymentMethod: null, paymentReference: null, cancelReason: null,
  createdAt: '2026-10-05T10:00:00', lines: [],
};

describe('PayoutsPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('edits rules as shares and fixed amounts, sent in basis points and paisa', () => {
    const api = {
      rules: vi.fn().mockReturnValue(of([doctor])),
      list: vi.fn().mockReturnValue(of({ content: [] })),
      setRules: vi.fn().mockReturnValue(of(doctor)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: PayoutService, useValue: api },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new PayoutsPageComponent());
    c.ngOnInit();
    expect(c.from.endsWith('-01')).toBe(true);
    c.editRules(doctor);
    expect(c.draft.CONSULTATION).toEqual({ mode: 'PERCENT', value: 50 });
    c.draft.SURGERY = { mode: 'FIXED', value: 10000 };
    c.saveRules(doctor);
    expect(api.setRules).toHaveBeenCalledWith('d1', [
      { source: 'CONSULTATION', mode: 'PERCENT', percentBasisPoints: 5000 },
      { source: 'SURGERY', mode: 'FIXED', fixedInPaisa: 1000000 },
    ]);
    expect(c.summary(doctor)).toContain('50% of fee');
  });
});

describe('PayoutStatementComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('adds a deduction as a negative amount', () => {
    const api = { get: vi.fn().mockReturnValue(of(statement)), addLine: vi.fn().mockReturnValue(of(statement)) };
    TestBed.configureTestingModule({
      providers: [
        { provide: PayoutService, useValue: api },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 's1' } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new PayoutStatementComponent());
    c.ngOnInit();
    expect(c.isDraft).toBe(true);
    c.lineText = 'Advance recovered';
    c.lineAmount = 1000;
    c.deduct = true;
    c.addLine();
    expect(api.addLine).toHaveBeenCalledWith('s1', 'Advance recovered', -100000);
    expect(c.money(-100000)).toBe('−₹1,000');
  });
});
