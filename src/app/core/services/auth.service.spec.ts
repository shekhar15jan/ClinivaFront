import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TenantContextService } from './tenant-context.service';
import { SendOtpRequest, VerifyOtpRequest } from '../models/auth.model';
import { ApiResponse } from '../models/common.model';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: TenantContextService, useValue: { clear: vi.fn() } },
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
      const mockResponse: ApiResponse<void> = { success: true, data: undefined, message: 'OTP sent' };

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
        expect(res.data?.accessToken).toBe('test-token');

        expect(service.isLoggedIn()).toBe(true);
        expect(service.getToken()).toBe('test-token');
        expect(service.getRefreshToken()).toBe('test-refresh');
        expect(service.currentUser()?.email).toBe('test@cliniva.com');
      });

      const req = httpMock.expectOne(`${service['apiUrl']}/auth/verify-otp`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should NOT store session when verifyOtp returns success: false', () => {
      const request: VerifyOtpRequest = { email: 'test@cliniva.com', otp: '000000' };
      const mockResponse = { success: false, data: undefined, message: 'Invalid OTP' };

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
        expect(service.getRefreshToken()).toBe('test-refresh');
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
      expect(service.getRefreshToken()).toBeNull();
      expect(service.currentUser()).toBeNull();

      const logoutReq = httpMock.expectOne(`${service['apiUrl']}/auth/logout`);
      expect(logoutReq.request.method).toBe('POST');
      logoutReq.flush({});
    });

    it('getToken should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });
});
