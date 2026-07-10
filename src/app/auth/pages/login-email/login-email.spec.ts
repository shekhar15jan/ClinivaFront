import { TestBed } from '@angular/core/testing';
import { LoginEmail } from './login-email';
import { AuthService } from '../../../core/services/auth.service';
import { TenantContextService } from '../../../core/services/tenant-context.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

function createLoginEmail() {
  const sendOtp = vi.fn().mockReturnValue(of({ success: true }));
  const authSpy = { sendOtp, pendingEmail: null, pendingTenantCode: null, loginStep: { set: vi.fn() } };
  const routerSpy = { navigate: vi.fn() };
  const tenantContextSpy = { tenant: vi.fn().mockReturnValue({ tenantId: 't1', name: 'Cliniva', status: 'ACTIVE' }) };
  const route = { parent: { snapshot: { params: { hospitalCode: 'test-hospital' } } } };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: TenantContextService, useValue: tenantContextSpy },
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: route },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new LoginEmail());
  component.ngOnInit();
  return { component, authSpy, routerSpy, tenantContextSpy };
}

describe('LoginEmail', () => {
  it('should create', () => {
    const { component } = createLoginEmail();
    expect(component).toBeTruthy();
  });

  it('should have email property', () => {
    const { component } = createLoginEmail();
    expect(component.email).toBe('');
  });

  it('should set hospitalCode from route on init', () => {
    const { component } = createLoginEmail();
    expect(component.hospitalCode).toBe('test-hospital');
  });

  it('should navigate to /login when no hospitalCode on init', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { sendOtp: vi.fn() } },
        { provide: TenantContextService, useValue: { tenant: vi.fn().mockReturnValue(null) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { hospitalCode: '' } } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new LoginEmail());
    const router = TestBed.inject(Router);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should call authService.sendOtp on sendOtp', () => {
    const { component, authSpy } = createLoginEmail();
    component.email = 'admin@cliniva.com';
    component.sendOtp();
    expect(authSpy.sendOtp).toHaveBeenCalledWith({
      email: 'admin@cliniva.com',
    });
  });

  it('should show error for empty email', () => {
    const { component } = createLoginEmail();
    component.email = '';
    component.sendOtp();
    expect(component.errorMessage).toBe('Please enter a valid email address.');
  });

  it('should show error for invalid email format', () => {
    const { component } = createLoginEmail();
    component.email = 'notanemail';
    component.sendOtp();
    expect(component.errorMessage).toBe('Please enter a valid email address.');
  });

  it('should have loading state to disable button during API call', () => {
    const { component } = createLoginEmail();
    expect(component.isLoading).toBe(false);
  });

  it('should set isLoading to true during sendOtp', () => {
    const sendOtpSubject = new Subject<unknown>();
    const authSpy = { sendOtp: vi.fn().mockReturnValue(sendOtpSubject), pendingEmail: null, pendingTenantCode: null, loginStep: { set: vi.fn() } };
    const routerSpy = { navigate: vi.fn() };
    const tenantContextSpy = { tenant: vi.fn().mockReturnValue({ tenantId: 't1', name: 'Cliniva', status: 'ACTIVE' }) };
    const route = { parent: { snapshot: { params: { hospitalCode: 'test-hospital' } } } };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: TenantContextService, useValue: tenantContextSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: route },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new LoginEmail());
    component.email = 'admin@cliniva.com';
    component.sendOtp();
    expect(component.isLoading).toBe(true);
    sendOtpSubject.next({ success: true });
    expect(component.isLoading).toBe(false);
  });

  it('should display error message when sendOtp fails', () => {
    const { component } = createLoginEmail();
    component.errorMessage = 'Failed to send OTP';
    expect(component.errorMessage).toBe('Failed to send OTP');
  });

  it('should navigate to otp page on successful OTP send', () => {
    const { component, routerSpy } = createLoginEmail();
    component.email = 'admin@cliniva.com';
    component.sendOtp();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/otp']);
  });
});
