import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { InsuranceService } from '../../core/services/insurance.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Claim } from '../../core/models/insurance.model';
import { ClaimDetailComponent } from './claim-detail';

const claim: Claim = {
  id: 'c1', claimNumber: 'CLM-2026-00001', status: 'PREAUTH_APPROVED', admissionId: 'a1', admissionNumber: 'IP-2026-00001',
  patientId: 'p1', patientName: 'Suresh', patientCode: 'P1', policyId: 'pol1', policyNumber: 'P/1', memberId: null,
  payerName: 'Star Health', payerKind: 'INSURER', tpaName: 'Medi Assist', payerReference: null, packageCode: null, packageName: null,
  requestedInPaisa: 3000000, approvedInPaisa: 2500000, claimedInPaisa: null, settledInPaisa: null, tdsInPaisa: null,
  deductionInPaisa: null, expectedInPaisa: 2500000, billTotalInPaisa: 3000000, billNumber: 'BILL-1', discharged: false,
  createdAt: '2026-10-05T10:00:00', events: [],
};

describe('ClaimDetailComponent', () => {
  let insurance: Record<string, ReturnType<typeof vi.fn>>;

  function create() {
    insurance = { get: vi.fn().mockReturnValue(of(claim)), step: vi.fn().mockReturnValue(of({ ...claim, status: 'CLAIM_SUBMITTED' })) };
    TestBed.configureTestingModule({
      providers: [
        { provide: InsuranceService, useValue: insurance },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'c1' } } } },
      ],
    });
    const c = TestBed.runInInjectionContext(() => new ClaimDetailComponent());
    c.ngOnInit();
    return c;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('offers only the steps an approved pre-authorisation allows, the claim first', () => {
    const c = create();
    expect(c.steps[0]).toBe('SUBMIT_CLAIM');
    expect(c.steps).not.toContain('SETTLE');
  });

  it('suggests the approved amount for the claim and sends it in paisa', () => {
    const c = create();
    c.choose('SUBMIT_CLAIM');
    expect(c.amount).toBe(25000);
    c.reference = 'CL-9';
    c.save();
    expect(insurance['step']).toHaveBeenCalledWith('c1', 'SUBMIT_CLAIM', 2500000, null, 'CL-9', null);
    expect(c.c?.status).toBe('CLAIM_SUBMITTED');
  });

  it('a query needs the question written down', () => {
    const c = create();
    c.choose('QUERY');
    expect(c.ready).toBe(false);
    c.note = 'Send the ultrasound report';
    expect(c.ready).toBe(true);
  });
});
