import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PatientRetention, PrivacyService, RetentionPolicy } from '../../core/services/privacy.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PatientRetentionComponent } from './patient-retention';
import { RetentionPolicyComponent } from './retention-policy';

const policy = (over: Partial<RetentionPolicy> = {}): RetentionPolicy => ({
  retentionYears: 10, autoAnonymise: false, dueShown: 1,
  due: [{ patientId: 'p1', patientCode: 'CLN-001', name: 'Old Patient', lastActivity: '2014-01-01T00:00:00', keepUntil: '2024-01-01T00:00:00' }],
  ...over,
});

const retention = (over: Partial<PatientRetention> = {}): PatientRetention => ({
  lastActivity: '2014-01-01T00:00:00', keepUntil: '2024-01-01T00:00:00', hasRecords: true, legalHold: false,
  legalHoldReason: null, anonymisedAt: null, eligible: true, ...over,
});

function setUp(privacy: Partial<PrivacyService>) {
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: PrivacyService, useValue: privacy }, { provide: ToastService, useValue: toast }] });
  return toast;
}

describe('RetentionPolicyComponent', () => {
  it('saves the period and anonymises the patients due', () => {
    const privacy = { retention: vi.fn().mockReturnValueOnce(of(policy())).mockReturnValue(of(policy({ dueShown: 0, due: [] }))),
      saveRetention: vi.fn().mockReturnValue(of(policy({ retentionYears: 8, autoAnonymise: true }))),
      runRetention: vi.fn().mockReturnValue(of({ anonymised: 1 })) };
    const toast = setUp(privacy);
    const c = TestBed.runInInjectionContext(() => new RetentionPolicyComponent());
    c.ngOnInit();
    expect(c.years).toBe(10);
    c.years = 8;
    c.auto = true;
    c.save();
    expect(privacy.saveRetention).toHaveBeenCalledWith(8, true);
    expect(c.auto).toBe(true);

    c.confirming = true;
    c.run();
    expect(toast.success).toHaveBeenCalledWith('1 patient anonymised');
    expect(c.p()?.dueShown).toBe(0);
    expect(c.confirming).toBe(false);
  });

  it('says why a period was refused', () => {
    const privacy = { retention: vi.fn().mockReturnValue(of(policy())),
      saveRetention: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Keep records at least 3 years' } }))),
      runRetention: vi.fn().mockReturnValue(throwError(() => ({}))) };
    const toast = setUp(privacy);
    const c = TestBed.runInInjectionContext(() => new RetentionPolicyComponent());
    c.ngOnInit();
    c.years = 1;
    c.save();
    expect(toast.error).toHaveBeenCalledWith('Keep records at least 3 years');
    c.run();
    expect(toast.error).toHaveBeenCalledWith('Not done.');
  });
});

describe('PatientRetentionComponent', () => {
  it('puts a record on legal hold with a reason and lifts it again', () => {
    const privacy = { patientRetention: vi.fn().mockReturnValue(of(retention())),
      setHold: vi.fn().mockReturnValueOnce(of(retention({ legalHold: true, legalHoldReason: 'Claim 117', eligible: false })))
        .mockReturnValueOnce(of(retention())) };
    const toast = setUp(privacy);
    const c = TestBed.runInInjectionContext(() => new PatientRetentionComponent());
    c.patientId = 'p1';
    c.ngOnChanges();
    c.holdReason = ' Claim 117 ';
    c.hold(true);
    expect(privacy.setHold).toHaveBeenCalledWith('p1', true, 'Claim 117');
    expect(c.r()?.legalHold).toBe(true);
    c.hold(false);
    expect(privacy.setHold).toHaveBeenLastCalledWith('p1', false, null);
    expect(toast.success).toHaveBeenLastCalledWith('Legal hold lifted');
  });

  it('anonymises after confirming and tells the page; refusals are shown', () => {
    const privacy = { patientRetention: vi.fn().mockReturnValue(of(retention())),
      anonymise: vi.fn().mockReturnValueOnce(of(retention({ anonymisedAt: '2026-10-06T10:00:00', eligible: false })))
        .mockReturnValueOnce(throwError(() => ({ error: { message: 'Medical records must be kept until 2030-01-01.' } }))) };
    const toast = setUp(privacy);
    const c = TestBed.runInInjectionContext(() => new PatientRetentionComponent());
    c.patientId = 'p1';
    c.ngOnChanges();
    const told = vi.fn();
    c.anonymised.subscribe(told);
    c.confirming = true;
    c.reason = 'Erasure request';
    c.anonymise();
    expect(privacy.anonymise).toHaveBeenCalledWith('p1', 'Erasure request');
    expect(told).toHaveBeenCalled();
    expect(c.confirming).toBe(false);
    c.anonymise();
    expect(toast.error).toHaveBeenCalledWith('Medical records must be kept until 2030-01-01.');
  });
});
