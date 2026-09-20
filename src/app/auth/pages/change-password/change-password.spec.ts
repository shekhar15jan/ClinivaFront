import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePassword } from './change-password';

function setup(pendingEmail: string | null = 'sai@clinic.test') {
  const authSpy = { pendingEmail, changePassword: vi.fn().mockReturnValue(of({ success: true })) };
  const routerSpy = { navigate: vi.fn() };
  const route = { parent: { snapshot: { params: { hospitalCode: 'sai-clinic' } } }, snapshot: { params: {} } };
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: route },
    ],
  });
  const component = TestBed.runInInjectionContext(() => new ChangePassword());
  component.ngOnInit();
  return { component, authSpy, routerSpy };
}

function fill(c: ChangePassword, current = 'Temp#1234', next = 'BrandNew#99', confirm = next) {
  c.currentPassword = current;
  c.newPassword = next;
  c.confirmPassword = confirm;
}

describe('ChangePassword', () => {
  it('prefills the email from the sign-in attempt and reads the hospital code', () => {
    const { component } = setup();
    expect(component.email).toBe('sai@clinic.test');
    expect(component.hospitalCode).toBe('sai-clinic');
  });

  it.each([
    ['missing current password', () => ({ current: '' }), 'current or temporary'],
    ['short new password', () => ({ next: 'short', confirm: 'short' }), 'at least 8'],
    ['same as current', () => ({ current: 'Same#password1', next: 'Same#password1' }), 'different'],
    ['mismatched confirmation', () => ({ confirm: 'Other#password1' }), 'do not match'],
  ])('rejects %s without calling the server', (_name, args, expected) => {
    const { component, authSpy } = setup();
    const a = args() as { current?: string; next?: string; confirm?: string };
    fill(component, a.current ?? 'Temp#1234', a.next ?? 'BrandNew#99', a.confirm ?? a.next ?? 'BrandNew#99');
    component.submit();
    expect(component.errorMessage).toContain(expected);
    expect(authSpy.changePassword).not.toHaveBeenCalled();
  });

  it('rejects an invalid email', () => {
    const { component } = setup(null);
    fill(component);
    component.submit();
    expect(component.errorMessage).toContain('valid email');
  });

  it('changes the password then returns to sign-in with a success flag', () => {
    const { component, authSpy, routerSpy } = setup();
    fill(component);
    component.submit();
    expect(authSpy.changePassword).toHaveBeenCalledWith('sai@clinic.test', 'Temp#1234', 'BrandNew#99');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/sai-clinic/login'], { queryParams: { passwordChanged: '1' } });
    expect(component.errorMessage).toBe('');
  });

  it('shows the server message when the current password is wrong', () => {
    const { component, authSpy } = setup();
    authSpy.changePassword.mockReturnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    fill(component);
    component.submit();
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBe(false);
  });

  it('falls back to a generic message when the server gives none', () => {
    const { component, authSpy } = setup();
    authSpy.changePassword.mockReturnValue(throwError(() => ({})));
    fill(component);
    component.submit();
    expect(component.errorMessage).toContain('Could not change the password');
  });

  it('goes back to sign-in', () => {
    const { component, routerSpy } = setup();
    component.backToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/sai-clinic/login']);
  });
});
