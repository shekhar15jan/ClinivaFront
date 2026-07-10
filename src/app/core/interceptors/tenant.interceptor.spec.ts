import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { TenantInterceptor } from './tenant.interceptor';

describe('TenantInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

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
  });

  it('should be provided as interceptor', () => {
    const interceptors = TestBed.inject(HTTP_INTERCEPTORS);
    const tenantInterceptor = interceptors.find(
      (i) => i instanceof TenantInterceptor,
    );
    expect(tenantInterceptor).toBeTruthy();
  });

  it('should pass through requests without modification', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.keys().length).toBe(0);
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe('/api/test');

    req.flush({ data: 'ok' });
  });

  it('should pass through POST requests', () => {
    http.post('/api/data', { foo: 'bar' }).subscribe();

    const req = httpMock.expectOne('/api/data');
    expect(req.request.body).toEqual({ foo: 'bar' });
    expect(req.request.method).toBe('POST');

    req.flush({ success: true });
  });
});
