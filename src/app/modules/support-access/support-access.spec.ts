import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { SupportAccessService, SupportRequestView } from '../../core/services/support-access.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { SupportAccessPageComponent } from './support-access-page';
import { SupportBannerComponent } from './support-banner';
import { SupportLoginComponent } from '../../auth/pages/support-login/support-login';

const request = (over: Partial<SupportRequestView> = {}): SupportRequestView => ({
  id: 'r1', status: 'REQUESTED', staffName: 'Asha', staffRole: 'SUPPORT_AGENT', reason: 'call', requestedAt: '2026-11-01T10:00:00Z',
  approvedAt: null, approvedBy: null, approvedMinutes: null, expiresAt: null, sessionOpen: false, ...over,
});

function setup(service: Partial<Record<keyof SupportAccessService, unknown>>, auth: Record<string, unknown> = {}) {
  const toast = { success: vi.fn(), error: vi.fn() };
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: SupportAccessService, useValue: service }, { provide: ToastService, useValue: toast },
      { provide: AuthService, useValue: auth }],
  });
  return { toast };
}

describe('SupportAccessPageComponent', () => {
  it('shows the waiting request and approves it for the default four hours', () => {
    const svc = { open: vi.fn().mockReturnValue(of([request()])), approve: vi.fn().mockReturnValue(of(request({ status: 'APPROVED' }))) };
    const { toast } = setup(svc);
    const page = TestBed.createComponent(SupportAccessPageComponent);
    page.detectChanges();
    expect(page.nativeElement.textContent).toContain('Approve support access');
    page.componentInstance.approve(request());
    expect(svc.approve).toHaveBeenCalledWith('r1', 240);
    expect(toast.success).toHaveBeenCalledWith('Support access approved.');
  });

  it('lets the owner choose a shorter time, deny, and end an open approval', () => {
    const svc = {
      open: vi.fn().mockReturnValue(of([])), approve: vi.fn().mockReturnValue(of(request())),
      deny: vi.fn().mockReturnValue(of(request())), revoke: vi.fn().mockReturnValue(of(request())),
    };
    setup(svc);
    const c = TestBed.createComponent(SupportAccessPageComponent).componentInstance;
    c.minutes = 30;
    c.approve(request());
    expect(svc.approve).toHaveBeenCalledWith('r1', 30);
    c.deny(request());
    expect(svc.deny).toHaveBeenCalledWith('r1');
    c.revoke(request({ status: 'APPROVED' }));
    expect(svc.revoke).toHaveBeenCalledWith('r1');
  });

  it('shows the platform message when something is refused', () => {
    const svc = { open: vi.fn().mockReturnValue(of([])), approve: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'no longer waiting' } }))) };
    const { toast } = setup(svc);
    TestBed.createComponent(SupportAccessPageComponent).componentInstance.approve(request());
    expect(toast.error).toHaveBeenCalledWith('no longer waiting');
  });

  it('the log lists what the platform and the clinic recorded', () => {
    const log = { platform: [{ id: 'p', actor: 'customer:Dr Owner', action: 'APPROVED', detail: '240 minutes', createdAt: '2026-11-01T10:00:00Z' }],
      clinic: [{ id: 'c', staffName: 'Asha', staffRole: 'SUPPORT_AGENT', event: 'ACTION', method: 'GET', path: '/api/v1/hms/patients', status: 200, createdAt: '2026-11-01T10:01:00Z' }] };
    setup({ open: vi.fn().mockReturnValue(of([])), log: vi.fn().mockReturnValue(of(log)) });
    const page = TestBed.createComponent(SupportAccessPageComponent);
    page.componentInstance.loadLog();
    page.detectChanges();
    expect(page.nativeElement.querySelector('#support-log').textContent).toContain('customer:Dr Owner');
    expect(page.nativeElement.querySelector('#support-log').textContent).toContain('GET /api/v1/hms/patients');
  });
});

describe('SupportBannerComponent', () => {
  it('shows the Support session bar with an End button that signs the staff member out', () => {
    const logout = vi.fn();
    setup({ open: vi.fn() }, {
      supportSession: signal({ sessionId: 's', staffName: 'Asha Agent', role: 'SUPPORT_READONLY', accessEndsAt: '2026-11-01T14:00:00Z' }),
      can: () => false, logout,
    });
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(SupportBannerComponent);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelector('.support-session')?.textContent).toContain('Support session');
    expect(el.querySelector('.support-session')?.textContent).toContain('read-only');
    (el.querySelector('.end-support') as HTMLButtonElement).click();
    expect(logout).toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith(['/login']);
    f.destroy();
  });

  it('tells the clinic owner when support is waiting, and nobody else', () => {
    const open = vi.fn().mockReturnValue(of([request()]));
    setup({ open }, { supportSession: signal(null), can: (p: string) => p === 'USER_MANAGE' });
    const f = TestBed.createComponent(SupportBannerComponent);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.support-waiting')?.textContent).toContain('asking for access');
    f.destroy();

    open.mockClear();
    setup({ open }, { supportSession: signal(null), can: () => false });
    const g = TestBed.createComponent(SupportBannerComponent);
    g.detectChanges();
    expect(open).not.toHaveBeenCalled();
    expect(g.nativeElement.querySelector('.support-waiting')).toBeNull();
    g.destroy();
  });
});

describe('SupportLoginComponent', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('takes the token from the address, removes it from the bar, signs in and opens the clinic', () => {
    window.history.replaceState(null, '', '/support-login#token=abc.def.ghi');
    const supportLogin = vi.fn().mockReturnValue(of({ tenantCode: 'sai-clinic' }));
    setup({}, { supportLogin });
    const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.createComponent(SupportLoginComponent).detectChanges();
    expect(supportLogin).toHaveBeenCalledWith('abc.def.ghi');
    expect(window.location.hash).toBe('');
    expect(nav).toHaveBeenCalledWith(['/', 'sai-clinic', 'dashboard']);
  });

  it('shows why when the token is missing or refused', () => {
    window.history.replaceState(null, '', '/support-login');
    const supportLogin = vi.fn();
    setup({}, { supportLogin });
    const f = TestBed.createComponent(SupportLoginComponent);
    f.detectChanges();
    expect(supportLogin).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector('.error')?.textContent).toContain('no support token');

    window.history.replaceState(null, '', '/support-login#token=used');
    setup({}, { supportLogin: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'This support token was already used' } }))) });
    const g = TestBed.createComponent(SupportLoginComponent);
    g.detectChanges();
    expect(g.nativeElement.querySelector('.error')?.textContent).toContain('already used');
  });
});
