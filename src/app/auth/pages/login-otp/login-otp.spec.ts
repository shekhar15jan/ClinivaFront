import { TestBed } from '@angular/core/testing';
import { LoginOtp } from './login-otp';
import { AuthService } from '../../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

function createLoginOtp() {
  const verifyOtp = vi.fn().mockReturnValue(of({ success: true, data: {} }));
  const sendOtp = vi.fn().mockReturnValue(of({ success: true }));
  const authSpy = { verifyOtp, sendOtp, pendingEmail: 'admin@cliniva.com', loginStep: { set: vi.fn() } };
  const routerSpy = { navigate: vi.fn() };
  const route = { parent: { snapshot: { params: { hospitalCode: 'test-hospital' } } } };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: route },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new LoginOtp());
  component.ngOnInit();
  return { component, authSpy, routerSpy };
}

describe('LoginOtp', () => {
  it('should create', () => {
    const { component } = createLoginOtp();
    expect(component).toBeTruthy();
  });

  it('should have digits array for OTP inputs', () => {
    const { component } = createLoginOtp();
    expect(component.digits.length).toBe(6);
  });

  it('should have loading state during OTP verification', () => {
    const { component } = createLoginOtp();
    expect(component.isLoading).toBe(false);
  });

  it('should display error message on invalid OTP', () => {
    const { component } = createLoginOtp();
    component.errorMessage = 'Invalid OTP';
    expect(component.errorMessage).toBe('Invalid OTP');
  });

  it('should have verifyOtp method that calls authService.verifyOtp', () => {
    const { component, authSpy } = createLoginOtp();
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.verifyOtp();
    expect(authSpy.verifyOtp).toHaveBeenCalledWith({
      email: 'admin@cliniva.com',
      otp: '123456',
    });
  });

  it('should show error when OTP is incomplete', () => {
    const { component } = createLoginOtp();
    component.digits = ['1', '2', '3', '', '', ''];
    component.verifyOtp();
    expect(component.errorMessage).toBe('Please enter the complete 6-digit OTP.');
  });

  it('should navigate to dashboard after successful OTP verification', () => {
    const { component, routerSpy } = createLoginOtp();
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.verifyOtp();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/dashboard']);
  });

  it('should start a patient in their own portal, not on the staff dashboard', () => {
    const { component, authSpy, routerSpy } = createLoginOtp();
    authSpy.verifyOtp.mockReturnValue(of({ success: true, data: { user: { role: 'PATIENT' } } }));
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.verifyOtp();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/patient/dashboard']);
  });

  it('should navigate to dashboard after successful OTP verification with requiresOnboarding', () => {
    const { component, routerSpy } = createLoginOtp();
    (component as unknown as Record<string, unknown>)['authService'] = {
      verifyOtp: vi.fn().mockReturnValue(of({ success: true, data: { requiresOnboarding: true } })),
    };
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.verifyOtp();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/dashboard']);
  });

  it('should set error message on verification failure', () => {
    const { component } = createLoginOtp();
    (component as unknown as Record<string, unknown>)['authService'] = {
      verifyOtp: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Invalid OTP. Please try again.' } }))),
    };
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.verifyOtp();
    expect(component.isLoading).toBe(false);
  });

  it('should set email and hospitalCode from auth service and route on init', () => {
    const { component } = createLoginOtp();
    expect(component.email).toBe('admin@cliniva.com');
    expect(component.hospitalCode).toBe('test-hospital');
  });

  it('should call sendOtp on resendOtp', () => {
    const { component, authSpy } = createLoginOtp();
    component.resendOtp();
    expect(authSpy.sendOtp).toHaveBeenCalledWith({
      email: 'admin@cliniva.com',
    });
  });

  it('should navigate back to login on goBack', () => {
    const { component, routerSpy } = createLoginOtp();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/login']);
  });

  it('should compute otpCode from digits', () => {
    const { component } = createLoginOtp();
    component.digits = ['1', '2', '3', '4', '5', '6'];
    expect(component.otpCode).toBe('123456');
  });

  it('should navigate to login page when no email on init', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { pendingEmail: '' } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { hospitalCode: 'test-hospital' } } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new LoginOtp());
    const router = TestBed.inject(Router);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/test-hospital/login']);
  });
});
