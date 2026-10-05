import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ToastService } from '../../shared/components/toast/toast.service';
import { HrLinkPageComponent } from './hr-link-page';

describe('HrLinkPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows the saved settings without the secret, and sends a new secret only when typed', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } }],
    });
    const http = TestBed.inject(HttpTestingController);
    const c = TestBed.runInInjectionContext(() => new HrLinkPageComponent());
    c.ngOnInit();
    http.expectOne((r) => r.url.endsWith('/hms/hr-link')).flush({ data: {
      endpointUrl: 'https://hr.example.com/hook', secretSet: true, enabled: true, sendStaff: true, sendPayouts: false,
      lastSuccessAt: null, lastError: null,
    } });
    http.expectOne((r) => r.url.endsWith('/hms/hr-link/deliveries')).flush({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } });
    expect(c.url).toBe('https://hr.example.com/hook');
    expect(c.secret).toBe('');
    expect(c.sendPayouts).toBe(false);

    c.save();
    const put = http.expectOne((r) => r.method === 'PUT');
    expect(put.request.body).toEqual({ endpointUrl: 'https://hr.example.com/hook', secret: null, enabled: true, sendStaff: true, sendPayouts: false });
    put.flush({ data: { endpointUrl: 'https://hr.example.com/hook', secretSet: true, enabled: true, sendStaff: true, sendPayouts: false,
      lastSuccessAt: null, lastError: null } });
    http.verify();
  });
});
