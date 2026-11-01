import { TestBed } from '@angular/core/testing';
import { SubscriptionStateService } from './subscription-state.service';

function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

describe('SubscriptionStateService', () => {
  let service: SubscriptionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubscriptionStateService);
  });

  it('is NORMAL until the sign-in answer says otherwise', () => {
    expect(service.state()).toBe('NORMAL');
    expect(service.daysLeft()).toBeNull();
    service.set({ state: 'NORMAL', until: null });
    expect(service.isTrial() || service.isReadOnly() || service.isLocked()).toBe(false);
  });

  it('counts the trial days left', () => {
    service.set({ state: 'TRIAL', until: isoDaysFromToday(12) });
    expect(service.isTrial()).toBe(true);
    expect(service.daysLeft()).toBe(12);
  });

  it('shows 0 on the last day and never goes negative', () => {
    service.set({ state: 'TRIAL', until: isoDaysFromToday(0) });
    expect(service.daysLeft()).toBe(0);
    service.set({ state: 'TRIAL', until: isoDaysFromToday(-3) });
    expect(service.daysLeft()).toBe(0);
  });

  it('read-only locks the day after its last day', () => {
    service.set({ state: 'READ_ONLY', until: '2026-11-15' });
    expect(service.isReadOnly()).toBe(true);
    const lock = service.lockDate()!;
    expect([lock.getFullYear(), lock.getMonth() + 1, lock.getDate()]).toEqual([2026, 11, 16]);
  });

  it('has no lock date outside read-only', () => {
    service.set({ state: 'TRIAL', until: isoDaysFromToday(5) });
    expect(service.lockDate()).toBeNull();
  });

  it('markLocked and clear', () => {
    service.markLocked();
    expect(service.isLocked()).toBe(true);
    service.clear();
    expect(service.state()).toBe('NORMAL');
  });
});
