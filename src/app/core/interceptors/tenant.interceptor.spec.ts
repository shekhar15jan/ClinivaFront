import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TenantInterceptor } from './tenant.interceptor';

describe('TenantInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  function setPath(pathname: string): void {
    window.history.pushState({}, '', pathname);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: TenantInterceptor, multi: true },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
    setPath('/');
  });

  it('should be provided as interceptor', () => {
    const interceptors = TestBed.inject(HTTP_INTERCEPTORS);
    const tenantInterceptor = interceptors.find(
      (i) => i instanceof TenantInterceptor,
    );
    expect(tenantInterceptor).toBeTruthy();
  });

  it('should add X-Tenant-Code header when hospitalCode is in URL', () => {
    setPath('/test-hospital/dashboard');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('X-Tenant-Code')).toBe('test-hospital');
    expect(req.request.method).toBe('GET');

    req.flush({ data: 'ok' });
  });

  it('should not add header for auth routes like login', () => {
    setPath('/login');

    http.get('/api/auth/login').subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('X-Tenant-Code')).toBe(false);

    req.flush({ success: true });
  });

  it('should skip header when no hospitalCode in path', () => {
    setPath('/');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('X-Tenant-Code')).toBe(false);

    req.flush({ data: 'ok' });
  });

  it('should pass through POST requests with header', () => {
    setPath('/my-hospital/patients');

    http.post('/api/data', { foo: 'bar' }).subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.body).toEqual({ foo: 'bar' });
    expect(req.request.headers.get('X-Tenant-Code')).toBe('my-hospital');
    expect(req.request.method).toBe('POST');

    req.flush({ success: true });
  });
});
