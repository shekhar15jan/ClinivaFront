import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { ToastService } from '../../shared/components/toast/toast.service';
import { AccountingLinkPageComponent } from './accounting-link-page';

describe('AccountingLinkPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows the saved link and saves the company, the state code and the switch', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } }],
    });
    const http = TestBed.inject(HttpTestingController);
    const c = TestBed.runInInjectionContext(() => new AccountingLinkPageComponent());
    c.ngOnInit();
    const saved = { companyId: '8f1c0d52-0000-4000-8000-000000000001', stateCode: '27', enabled: true, lastSuccessAt: null, lastError: null };
    http.expectOne((r) => r.url.endsWith('/hms/accounting-link')).flush({ data: saved });
    http.expectOne((r) => r.url.endsWith('/hms/accounting-link/events')).flush({ data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 } });
    expect(c.companyId).toBe(saved.companyId);
    expect(c.stateCode).toBe('27');

    c.stateCode = ' 29 ';
    c.save();
    const put = http.expectOne((r) => r.method === 'PUT');
    expect(put.request.body).toEqual({ companyId: saved.companyId, stateCode: '29', enabled: true });
    put.flush({ data: { ...saved, stateCode: '29' } });
    http.verify();
  });
});
