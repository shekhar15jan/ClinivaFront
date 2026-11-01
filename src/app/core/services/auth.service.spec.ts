import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TenantContextService } from './tenant-context.service';
import { EffectiveLicenseService } from './effective-license.service';
import { SendOtpRequest, VerifyOtpRequest } from '../models/auth.model';
import { ApiResponse } from '../models/common.model';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const license = { loadLicense: vi.fn() };

  beforeEach(() => {
    license.loadLicense.mockReset().mockReturnValue(of({}));
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TenantContextService, useValue: { clear: vi.fn() } },
        { provide: EffectiveLicenseService, useValue: license },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('sendOtp', () => {
    it('should POST to send-otp with email', () => {
      const request: SendOtpRequest = { email: 'test@cliniva.com' };
      const mockResponse: ApiResponse<void> = { success: true, data: undefined, message: 'OTP sent', timestamp: '', requestId: '' };

      service.sendOtp(request).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.message).toBe('OTP sent');
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/send-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should handle error when sendOtp fails', () => {
      const request: SendOtpRequest = { email: 'invalid@test.com' };

      service.sendOtp(request).subscribe({
        error: (err) => {
          expect(err.status).toBe(400);
        },
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/send-otp`);
      req.flush({ success: false, message: 'Email not registered' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('verifyOtp', () => {
    it('should POST to verify-otp and store session on success', () => {
      const request: VerifyOtpRequest = { email: 'test@cliniva.com', otp: '123456' };
      const rawData = {
        token: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: 'u1', email: 'test@cliniva.com', role: 'ADMIN' },
      };
      const mockResponse = { success: true, data: rawData };

      service.verifyOtp(request).subscribe((res) => {
        expect(res.success).toBe(true);
        expect(res.data?.token).toBe('test-token');

        expect(service.isLoggedIn()).toBe(true);
        expect(service.getToken()).toBe('test-token');
        // Kept in memory only: nothing a script could read is written to browser storage.
        expect(localStorage.getItem('cliniva_access_token')).toBeNull();
        expect(localStorage.getItem('cliniva_refresh_token')).toBeNull();
        expect(service.currentUser()?.email).toBe('test@cliniva.com');
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      // So the browser keeps the HttpOnly refresh cookie the API sets.
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('should NOT store session when verifyOtp returns success: false', () => {
      const request: VerifyOtpRequest = { email: 'test@cliniva.com', otp: '000000' };
      const mockResponse = { success: false, data: undefined, message: 'Invalid OTP', timestamp: '', requestId: '' };

      service.verifyOtp(request).subscribe((res) => {
        expect(res.success).toBe(false);
        expect(service.isLoggedIn()).toBe(false);
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`);
      req.flush(mockResponse);
    });
  });

  describe('session management', () => {
    it('isLoggedIn should return false initially', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should be logged in after verifyOtp sets session', () => {
      const rawData = {
        token: 'test-token',
        refreshToken: 'test-refresh',
        user: { id: 'u1', email: 'test@cliniva.com', role: 'ADMIN' },
      };
      const mockResponse = { success: true, data: rawData };

      service.verifyOtp({ email: 'test@cliniva.com', otp: '123456' }).subscribe(() => {
        expect(service.isLoggedIn()).toBe(true);
        expect(service.getToken()).toBe('test-token');
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`);
      req.flush(mockResponse);
    });

    it('logout should clear all stored data', () => {
      const rawData = {
        token: 'token',
        refreshToken: 'refresh',
        user: { id: 'u1', email: 'test@cliniva.com', role: 'ADMIN' },
      };
      const mockResponse = { success: true, data: rawData };

      service.verifyOtp({ email: 'test@cliniva.com', otp: '123456' }).subscribe();
      const loginReq = httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`);
      loginReq.flush(mockResponse);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();

      const logoutReq = httpMock.expectOne(`${service['apiUrl']}/auth/logout`);
      expect(logoutReq.request.method).toBe('POST');
      logoutReq.flush({});
    });

    it('getToken should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('the clinic licence after sign-in', () => {
    const signIn = (flush: () => void) => {
      let done = false;
      service.verifyOtp({ email: 'test@cliniva.com', otp: '123456' }).subscribe(() => (done = true));
      flush();
      return () => done;
    };
    const answer = () =>
      httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`).flush({
        success: true,
        data: { token: 't', refreshToken: 'r', user: { id: 'u1', email: 'test@cliniva.com', role: 'ADMIN' } },
      });

    it('loads the signed-in clinic licence (modules and limits) before the first screen opens', () => {
      const finished = signIn(answer);

      expect(license.loadLicense).toHaveBeenCalledTimes(1);
      expect(finished()).toBe(true);
    });

    it('still signs in when the licence cannot be loaded', () => {
      license.loadLicense.mockReturnValue(throwError(() => new Error('network')));

      const finished = signIn(answer);

      expect(finished()).toBe(true);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('does not load a licence when the code was wrong', () => {
      service.verifyOtp({ email: 'test@cliniva.com', otp: '000000' }).subscribe();
      httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`).flush({ success: false, message: 'Invalid code' });

      expect(license.loadLicense).not.toHaveBeenCalled();
    });

    it('loads it again when the session is restored after a page reload', async () => {
      localStorage.setItem('cliniva_signed_in', '1');
      const restored = service.silentRefresh();
      httpMock.expectOne(`${service['apiUrl']}/auth/refresh`).flush({
        success: true,
        data: { token: 't2', refreshToken: 'r2', user: { id: 'u1', email: 'test@cliniva.com', role: 'ADMIN' } },
      });
      await restored;

      expect(license.loadLicense).toHaveBeenCalledTimes(1);
      expect(service.isLoggedIn()).toBe(true);
      localStorage.removeItem('cliniva_signed_in');
    });
  });
});
