import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { of } from 'rxjs';
import { AuthService, SupportLoginData } from './auth.service';
import { TenantContextService } from './tenant-context.service';
import { EffectiveLicenseService } from './effective-license.service';
import { SupportAccessService, SUPPORT_DURATIONS } from './support-access.service';

const data = (over: Partial<SupportLoginData> = {}): SupportLoginData => ({
  accessToken: 'clinic-token', accessTokenExpiresAt: '2026-11-01T10:05:00Z', accessEndsAt: '2026-11-01T14:00:00Z',
  sessionId: 's1', tenantId: 't1', staffName: 'Asha Agent', role: 'SUPPORT_AGENT', tenantCode: 'sai-clinic',
  tenantName: 'Sai Clinic', permissions: ['PATIENT_VIEW', 'PATIENT_EDIT'], ...over,
});

describe('support session in AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TenantContextService, useValue: { clear: vi.fn() } },
        { provide: EffectiveLicenseService, useValue: { loadLicense: vi.fn().mockReturnValue(of({})), seedModules: vi.fn() } },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('exchanges the platform token for a clinic session with the support role and its permissions', () => {
    let tenantCode = '';
    auth.supportLogin('platform-token').subscribe((d) => (tenantCode = d.tenantCode ?? ''));
    const req = http.expectOne((r) => r.url.endsWith('/auth/support-login'));
    expect(req.request.body).toEqual({ token: 'platform-token' });
    req.flush({ success: true, data: data() });

    expect(tenantCode).toBe('sai-clinic');
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getToken()).toBe('clinic-token');
    expect(auth.supportSession()).toEqual({ sessionId: 's1', staffName: 'Asha Agent', role: 'SUPPORT_AGENT', accessEndsAt: '2026-11-01T14:00:00Z' });
    expect(auth.currentUserValue?.role).toBe('SUPPORT_AGENT');
    expect(auth.can('PATIENT_EDIT')).toBe(true);
    expect(auth.can('USER_MANAGE')).toBe(false);
  });

  it('a failed login leaves the user signed out', () => {
    auth.supportLogin('used-token').subscribe({ error: () => undefined });
    http.expectOne((r) => r.url.endsWith('/auth/support-login')).flush({ message: 'already used' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.supportSession()).toBeNull();
  });

  it('renews through the support route with the current token, not the clinic cookie', () => {
    auth.supportLogin('p').subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/support-login')).flush({ data: data() });
    let renewed = '';
    auth.refreshToken().subscribe((t) => (renewed = t));
    const req = http.expectOne((r) => r.url.endsWith('/auth/support-refresh'));
    expect(req.request.headers.get('Authorization')).toBe('Bearer clinic-token');
    req.flush({ data: data({ accessToken: 'newer-token' }) });
    expect(renewed).toBe('newer-token');
    expect(auth.getToken()).toBe('newer-token');
  });

  it('a refused renewal (revoked or expired) ends the session', () => {
    auth.supportLogin('p').subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/support-login')).flush({ data: data() });
    let failed = false;
    auth.refreshToken().subscribe({ error: () => (failed = true) });
    http.expectOne((r) => r.url.endsWith('/auth/support-refresh')).flush({ message: 'ended' }, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBe(true);
  });

  it('logging out tells the clinic the support session ended and forgets everything', () => {
    auth.supportLogin('p').subscribe();
    http.expectOne((r) => r.url.endsWith('/auth/support-login')).flush({ data: data() });
    auth.logout();
    const end = http.expectOne((r) => r.url.endsWith('/hms/support-access/session/end'));
    expect(end.request.headers.get('Authorization')).toBe('Bearer clinic-token');
    end.flush({});
    http.expectOne((r) => r.url.endsWith('/auth/logout')).flush({});
    expect(auth.supportSession()).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('cliniva_support_token')).toBeNull();
  });

  it('after a reload the saved support token is renewed with the platform check, or dropped', async () => {
    sessionStorage.setItem('cliniva_support_token', 'saved');
    const done = auth.silentRefresh();
    const req = http.expectOne((r) => r.url.endsWith('/auth/support-refresh'));
    expect(req.request.headers.get('Authorization')).toBe('Bearer saved');
    req.flush({ message: 'revoked' }, { status: 401, statusText: 'Unauthorized' });
    await done;
    expect(auth.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('cliniva_support_token')).toBeNull();
  });
});

describe('SupportAccessService', () => {
  it('talks to the owner endpoints and defaults to four hours', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    const service = TestBed.inject(SupportAccessService);
    const http = TestBed.inject(HttpTestingController);
    expect(SUPPORT_DURATIONS[0].minutes).toBe(240);

    service.approve('r1', 30).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/hms/support-access/requests/r1/approve'));
    expect(req.request.body).toEqual({ minutes: 30 });
    req.flush({ data: {} });
    service.revoke('r1').subscribe();
    http.expectOne((r) => r.url.endsWith('/requests/r1/revoke')).flush({ data: {} });
    service.deny('r1').subscribe();
    http.expectOne((r) => r.url.endsWith('/requests/r1/deny')).flush({ data: {} });
    let n = -1;
    service.open().subscribe((l) => (n = l.length));
    http.expectOne((r) => r.url.endsWith('/requests')).flush({ data: [] });
    expect(n).toBe(0);
    http.verify();
  });
});
