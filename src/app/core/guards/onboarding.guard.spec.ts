import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { OnboardingGuard } from './onboarding.guard';
import { OnboardingService } from '../services/onboarding.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('OnboardingGuard', () => {
  let guard: OnboardingGuard;
  let onboardingService: OnboardingService;
  let router: Router;

  beforeEach(() => {
    const onboardingSpy = {
      getStatus: vi.fn(),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        OnboardingGuard,
        { provide: OnboardingService, useValue: onboardingSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    guard = TestBed.inject(OnboardingGuard);
    onboardingService = TestBed.inject(OnboardingService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should redirect to onboarding when onboarding is NOT complete', async () => {
    (onboardingService.getStatus as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ success: true, data: { isComplete: false, currentStep: 1, totalSteps: 5, steps: [] }, message: '' }),
    );
    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;

    const result = await guard.canActivate(route);

    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/hosp1/onboarding']);
  });

  it('should allow activation when onboarding is complete', async () => {
    (onboardingService.getStatus as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ success: true, data: { isComplete: true, currentStep: 5, totalSteps: 5, steps: [] }, message: '' }),
    );
    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;

    const result = await guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow activation when API call fails', async () => {
    (onboardingService.getStatus as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => new Error('Server error')),
    );
    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;

    const result = await guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should allow activation when response success is false', async () => {
    (onboardingService.getStatus as ReturnType<typeof vi.fn>).mockReturnValue(
      of({ success: false, data: null, message: 'Error' }),
    );
    const route = { params: { hospitalCode: 'hosp1' } } as unknown as ActivatedRouteSnapshot;

    const result = await guard.canActivate(route);

    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
