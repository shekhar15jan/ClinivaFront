import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RegisterPatient } from './register-patient';
import { AuthService } from '../../../core/services/auth.service';

function create(auth: Record<string, unknown> = {}) {
  const authSpy = {
    sendRegistrationCode: vi.fn().mockReturnValue(of({ success: true })),
    register: vi.fn().mockReturnValue(of({ success: true })),
    pendingEmail: null,
    ...auth,
  };
  const router = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { hospitalCode: 'abc' } } }, snapshot: { params: {} } } },
    ],
  });
  const c = TestBed.runInInjectionContext(() => new RegisterPatient());
  c.ngOnInit();
  c.fullName = 'Asha Rao';
  c.email = 'asha@x.test';
  c.phone = '9876543210';
  c.acceptPrivacyNotice = true;
  return { c, authSpy, router };
}

describe('RegisterPatient', () => {
  it('rejects missing privacy acceptance without calling the server', () => {
    const { c, authSpy } = create();
    c.acceptPrivacyNotice = false;
    c.sendCode();
    expect(c.error()).toContain('privacy');
    expect(authSpy.sendRegistrationCode).not.toHaveBeenCalled();
  });

  it('moves to the code step after the code is sent', () => {
    const { c, authSpy } = create();
    c.sendCode();
    expect(authSpy.sendRegistrationCode).toHaveBeenCalledWith({ email: 'asha@x.test', tenantCode: 'abc' });
    expect(c.step()).toBe(2);
  });

  it('shows the server message when sending the code fails', () => {
    const { c } = create({ sendRegistrationCode: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Too many tries' } }))) });
    c.sendCode();
    expect(c.error()).toBe('Too many tries');
    expect(c.step()).toBe(1);
  });

  it('registers with the otp as a PATIENT', () => {
    const { c, authSpy } = create();
    c.sendCode();
    c.otp = ' 123456 ';
    c.createAccount();
    const body = authSpy.register.mock.calls[0][0];
    expect(body.otp).toBe('123456');
    expect(body.role).toBe('PATIENT');
    expect(body.tenantCode).toBe('abc');
    expect(c.done()).toBe(true);
  });

  it('asks for the code and reports a wrong one', () => {
    const { c } = create({ register: vi.fn().mockReturnValue(throwError(() => ({ error: {} }))) });
    c.createAccount();
    expect(c.error()).toContain('enter the code');
    c.otp = '1';
    c.createAccount();
    expect(c.error()).toContain('did not work');
    expect(c.done()).toBe(false);
  });

  it('go back keeps details and clears the code', () => {
    const { c } = create();
    c.sendCode();
    c.otp = '9';
    c.back();
    expect(c.step()).toBe(1);
    expect(c.otp).toBe('');
    expect(c.email).toBe('asha@x.test');
  });
});
