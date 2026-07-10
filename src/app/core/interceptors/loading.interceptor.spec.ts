import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { LoadingInterceptor } from './loading.interceptor';
import { LayoutStore } from '../store/layout.store';
import { vi } from 'vitest';

describe('LoadingInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let layoutStore: LayoutStore;

  beforeEach(() => {
    const layoutSpy = {
      setLoading: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: LayoutStore, useValue: layoutSpy },
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    layoutStore = TestBed.inject(LayoutStore);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should set loading true on request and false on response', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(layoutStore.setLoading).toHaveBeenCalledWith(true);

    req.flush({});
    expect(layoutStore.setLoading).toHaveBeenCalledWith(false);
  });

  it('should not show loading for /internal/license requests', () => {
    http.get('/api/v1/hms/internal/license').subscribe();

    const req = httpMock.expectOne('/api/v1/hms/internal/license');
    expect(layoutStore.setLoading).not.toHaveBeenCalled();

    req.flush({});
  });

  it('should not show loading for /auth/ requests', () => {
    http.post('/api/v1/hms/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/v1/hms/auth/login');
    expect(layoutStore.setLoading).not.toHaveBeenCalled();

    req.flush({});
  });

  it('should only set loading false after all concurrent requests complete', () => {
    http.get('/api/test/1').subscribe();
    http.get('/api/test/2').subscribe();

    const req1 = httpMock.expectOne('/api/test/1');
    const req2 = httpMock.expectOne('/api/test/2');

    expect(layoutStore.setLoading).toHaveBeenCalledWith(true);
    expect(layoutStore.setLoading).toHaveBeenCalledTimes(2);

    req1.flush({});
    expect(layoutStore.setLoading).toHaveBeenCalledTimes(2);

    req2.flush({});
    expect(layoutStore.setLoading).toHaveBeenCalledWith(false);
    expect(layoutStore.setLoading).toHaveBeenCalledTimes(3);
  });
});
