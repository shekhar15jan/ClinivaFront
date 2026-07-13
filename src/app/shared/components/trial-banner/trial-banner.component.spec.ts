import { TestBed } from '@angular/core/testing';
import { TrialBannerComponent } from './trial-banner.component';
import { EffectiveLicenseService } from '../../../core/services/effective-license.service';
import { vi } from 'vitest';

describe('TrialBannerComponent', () => {
  function setup({ isTrial = false, trialEndsAt = null, planName = 'Free' }: { isTrial?: boolean; trialEndsAt?: string | null; planName?: string } = {}) {
    const mockLicenseService = {
      isTrial: vi.fn().mockReturnValue(isTrial),
      trialEndsAt: vi.fn().mockReturnValue(trialEndsAt),
      planName: vi.fn().mockReturnValue(planName),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: EffectiveLicenseService, useValue: mockLicenseService },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new TrialBannerComponent());
    return { component, mockLicenseService };
  }

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should be visible when trial', () => {
    const { component } = setup({ isTrial: true });
    expect(component.isVisible()).toBe(true);
  });

  it('should not be visible when not trial', () => {
    const { component } = setup({ isTrial: false });
    expect(component.isVisible()).toBe(false);
  });

  it('should calculate days remaining correctly', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const { component } = setup({ isTrial: true, trialEndsAt: futureDate });
    expect(component.daysRemaining()).toBe(10);
  });

  it('should return 0 days when trialEndsAt is null', () => {
    const { component } = setup({ isTrial: true, trialEndsAt: null });
    expect(component.daysRemaining()).toBe(0);
  });

  it('should return 0 for expired trial', () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { component } = setup({ isTrial: true, trialEndsAt: pastDate });
    expect(component.daysRemaining()).toBe(0);
  });

  it('should expose planName from license service', () => {
    const { component } = setup({ planName: 'Pro' });
    expect(component.licenseService.planName()).toBe('Pro');
  });
});
