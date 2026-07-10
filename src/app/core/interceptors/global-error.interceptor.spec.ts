import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { GlobalErrorInterceptor } from './global-error.interceptor';
import { ToastService } from '../../shared/components/toast/toast.service';
import { EffectiveLicenseService } from '../services/effective-license.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('GlobalErrorInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let toastService: ToastService;
  let licenseService: EffectiveLicenseService;

  beforeEach(() => {
    const toastSpy = {
      show: vi.fn(),
    };
    const routerSpy = {
      navigate: vi.fn(),
    };
    const licenseSpy = {
      loadLicense: vi.fn().mockReturnValue(of({} as unknown as Record<string, never>)),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ToastService, useValue: toastSpy },
        { provide: Router, useValue: routerSpy },
        { provide: EffectiveLicenseService, useValue: licenseSpy },
        { provide: HTTP_INTERCEPTORS, useClass: GlobalErrorInterceptor, multi: true },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    toastService = TestBed.inject(ToastService);
    licenseService = TestBed.inject(EffectiveLicenseService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through /auth/ errors without handling', () => {
    http.get('/api/v1/hms/auth/user').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/api/v1/hms/auth/user');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(toastService.show).not.toHaveBeenCalled();
  });

  it('should do nothing for 401 errors on non-auth routes', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(toastService.show).not.toHaveBeenCalled();
  });

  it('should handle 403 with module message and reload license', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(403);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush(
      { message: 'Module not available' },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(toastService.show).toHaveBeenCalledWith(
      'This module is not available in your current plan. Please upgrade.',
      'warning',
    );
    expect(licenseService.loadLicense).toHaveBeenCalled();
  });

  it('should handle 403 with generic error message', () => {
    http.get('/api/doctors').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(403);
      },
    });

    const req = httpMock.expectOne('/api/doctors');
    req.flush(
      { message: 'Access denied' },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(toastService.show).toHaveBeenCalledWith('Access denied', 'error');
    expect(licenseService.loadLicense).not.toHaveBeenCalled();
  });

  it('should do nothing for 404 errors', () => {
    http.get('/api/unknown').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(404);
      },
    });

    const req = httpMock.expectOne('/api/unknown');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    expect(toastService.show).not.toHaveBeenCalled();
  });

  it('should show warning toast for 409 conflict errors', () => {
    http.post('/api/patients', {}).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(409);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush(
      { message: 'Duplicate entry' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(toastService.show).toHaveBeenCalledWith(
      'Duplicate entry',
      'warning',
    );
  });

  it('should show default message for 409 without body', () => {
    http.post('/api/patients', {}).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(409);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 409, statusText: 'Conflict' });

    expect(toastService.show).toHaveBeenCalledWith(
      'Conflict: duplicate entry detected.',
      'warning',
    );
  });

  it('should show error toast for 422 validation errors', () => {
    http.post('/api/patients', {}).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(422);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush(
      { message: 'Validation failed' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    expect(toastService.show).toHaveBeenCalledWith('Validation failed', 'error');
  });

  it('should show warning toast for 429 rate limit errors', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(429);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 429, statusText: 'Too Many Requests' });

    expect(toastService.show).toHaveBeenCalledWith(
      'Too many requests. Please wait a moment.',
      'warning',
    );
  });

  it('should show error toast for 500 errors', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(toastService.show).toHaveBeenCalledWith(
      'Server error. Please try again later.',
      'error',
    );
  });

  it('should show error toast for 502 errors', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(502);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 502, statusText: 'Bad Gateway' });

    expect(toastService.show).toHaveBeenCalledWith(
      'Server error. Please try again later.',
      'error',
    );
  });

  it('should show error toast for 503 errors', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(503);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.flush({}, { status: 503, statusText: 'Service Unavailable' });

    expect(toastService.show).toHaveBeenCalledWith(
      'Server error. Please try again later.',
      'error',
    );
  });

  it('should show network error toast for status 0', () => {
    http.get('/api/patients').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(0);
      },
    });

    const req = httpMock.expectOne('/api/patients');
    req.error(new ProgressEvent('error'));

    expect(toastService.show).toHaveBeenCalledWith(
      'Network error. Please check your connection.',
      'error',
    );
  });
});
