import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SubscriptionBannerComponent, planLink } from './subscription-banner.component';
import { SubscriptionLockedComponent } from './subscription-locked.component';
import { SubscriptionStateService } from '../../../core/services/subscription-state.service';

function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

describe('planLink', () => {
  it('points at the clinic plan screen', () => {
    expect(planLink('/sunrise/patients/12?tab=1')).toEqual(['/', 'sunrise', 'settings', 'plan']);
  });
  it('falls back to the root with no clinic in the address', () => {
    expect(planLink('/')).toEqual(['/']);
  });
});

describe('Subscription banner and locked screen', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [SubscriptionBannerComponent, SubscriptionLockedComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    return TestBed.inject(SubscriptionStateService);
  }

  it('shows nothing for a current subscription', async () => {
    await setup();
    const fixture = TestBed.createComponent(SubscriptionBannerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('shows the days left during the trial', async () => {
    const state = await setup();
    state.set({ state: 'TRIAL', until: isoDaysFromToday(9) });
    const fixture = TestBed.createComponent(SubscriptionBannerComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#subscription-banner-trial').textContent).toContain('9 days left');
  });

  it('says what read-only means, when it locks, and offers Renew', async () => {
    const state = await setup();
    state.set({ state: 'READ_ONLY', until: '2026-11-15' });
    const fixture = TestBed.createComponent(SubscriptionBannerComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('#subscription-banner-readonly').textContent;
    expect(text).toContain('nothing can be added or changed');
    expect(text).toContain('16 Nov 2026');
    expect(fixture.nativeElement.querySelector('#subscription-renew').textContent).toContain('Renew');
  });

  it('the locked screen explains and offers renewal', async () => {
    await setup();
    const fixture = TestBed.createComponent(SubscriptionLockedComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('This clinic is locked');
    expect(fixture.nativeElement.querySelector('#subscription-locked-renew')).toBeTruthy();
  });
});
