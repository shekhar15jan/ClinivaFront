import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { ChangePassword } from './change-password/change-password';
import { LoginEmail } from './login-email/login-email';
import { LoginOtp } from './login-otp/login-otp';

/**
 * The app runs without zone.js, so a page only re-renders when something it reads is a signal.
 * A plain field changed in an HTTP callback left the button on "Sending..." with no error shown
 * (found driving the real UI). Reading each page's state through a computed proves it is reactive.
 */
describe('auth pages keep their state in signals', () => {
  const route = { parent: { snapshot: { params: { hospitalCode: 'sai' } } }, snapshot: { params: {}, queryParams: {} } };

  function create<T>(type: new () => T, auth: Record<string, unknown>): T {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { pendingEmail: 'sai@clinic.test', loginStep: { set: vi.fn() }, ...auth } },
        { provide: TenantContextService, useValue: { tenant: () => ({ tenantId: 't1' }) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: route },
      ],
    });
    return TestBed.runInInjectionContext(() => new type());
  }

  it('LoginEmail: a failed send updates what the view reads', () => {
    const page = create(LoginEmail, {
      sendOtp: () => throwError(() => ({ error: { message: 'Password change required. Please reset your password before signing in.' } })),
    });
    page.ngOnInit();
    const view = TestBed.runInInjectionContext(() =>
      computed(() => ({ loading: page.isLoading, error: page.errorMessage, blocked: page.passwordChangeRequired })));
    expect(view()).toEqual({ loading: false, error: '', blocked: false });

    page.email = 'sai@clinic.test';
    page.sendOtp();

    expect(view()).toEqual({ loading: false, error: expect.stringContaining('Password change required'), blocked: true });
  });

  it('LoginEmail: the "password changed" banner is reactive too', () => {
    const page = create(LoginEmail, {});
    const banner = TestBed.runInInjectionContext(() => computed(() => page.passwordChanged));
    expect(banner()).toBe(false);
    page.passwordChanged = true;
    expect(banner()).toBe(true);
  });

  it('LoginOtp: a rejected code updates what the view reads', () => {
    const page = create(LoginOtp, { verifyOtp: () => throwError(() => ({ error: { message: 'Invalid OTP' } })) });
    const view = TestBed.runInInjectionContext(() => computed(() => ({ loading: page.isLoading, error: page.errorMessage })));
    page.digits = ['1', '2', '3', '4', '5', '6'];
    page.verifyOtp();
    expect(view()).toEqual({ loading: false, error: 'Invalid OTP' });
  });

  it('ChangePassword: validation and server errors update what the view reads', () => {
    const page = create(ChangePassword, { changePassword: () => throwError(() => ({ error: { message: 'Invalid credentials' } })) });
    page.ngOnInit();
    const view = TestBed.runInInjectionContext(() => computed(() => ({ loading: page.isLoading, error: page.errorMessage })));

    page.submit();
    expect(view().error).toContain('current or temporary');

    page.currentPassword = 'Temp#1234';
    page.newPassword = 'BrandNew#99';
    page.confirmPassword = 'BrandNew#99';
    page.submit();
    expect(view()).toEqual({ loading: false, error: 'Invalid credentials' });
  });

  it('ChangePassword: shows loading while the request is in flight', () => {
    const page = create(ChangePassword, { changePassword: () => of({ success: true }) });
    page.ngOnInit();
    const loading = TestBed.runInInjectionContext(() => computed(() => page.isLoading));
    expect(loading()).toBe(false);
    page.isLoading = true;
    expect(loading()).toBe(true);
  });
});
