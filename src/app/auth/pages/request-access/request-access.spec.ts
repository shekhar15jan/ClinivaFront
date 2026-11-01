import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RequestAccess } from './request-access';
import { AuthService } from '../../../core/services/auth.service';

function create(auth: Record<string, unknown> = {}) {
  const authSpy = { requestAccess: vi.fn().mockReturnValue(of({ success: true })), pendingEmail: 'typed@x.test', ...auth };
  const router = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: router },
      { provide: ActivatedRoute, useValue: { parent: { snapshot: { params: { hospitalCode: 'abc' } } }, snapshot: { params: {} } } },
    ],
  });
  const c = TestBed.runInInjectionContext(() => new RequestAccess());
  c.ngOnInit();
  return { c, authSpy, router };
}

describe('RequestAccess', () => {
  it('starts with the email typed at sign-in', () => {
    expect(create().c.contact).toBe('typed@x.test');
  });

  it('refuses a contact that is neither email nor mobile', () => {
    const { c, authSpy } = create();
    c.contact = 'hello';
    c.consent = true;
    c.submit();
    expect(c.error()).toContain('email address or a mobile');
    expect(authSpy.requestAccess).not.toHaveBeenCalled();
  });

  it('needs the consent tick', () => {
    const { c, authSpy } = create();
    c.submit();
    expect(c.error()).toContain('tick the box');
    expect(authSpy.requestAccess).not.toHaveBeenCalled();
  });

  it('sends the request and shows the same thank-you whatever the contact', () => {
    const { c, authSpy } = create();
    c.consent = true;
    c.submit();
    expect(authSpy.requestAccess).toHaveBeenCalled();
    expect(authSpy.requestAccess.mock.calls[0][0].contact).toBe('typed@x.test');
    expect(c.sent()).toBe(true);
  });

  it('says to wait after too many requests', () => {
    const { c } = create({ requestAccess: vi.fn().mockReturnValue(throwError(() => ({ status: 429 }))) });
    c.consent = true;
    c.submit();
    expect(c.error()).toContain('Too many');
    expect(c.sent()).toBe(false);
  });

  it('goes back to the clinic sign-in', () => {
    const { c, router } = create();
    c.goToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/abc/login']);
  });
});
