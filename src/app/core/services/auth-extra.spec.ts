import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TenantContextService } from './tenant-context.service';
import { AuthResponse } from '../models/auth.model';
import { ApiResponse } from '../models/common.model';
import { TenantResolution } from '../models/tenant.model';
import { environment } from '../../../environments/environment';

describe('AuthService — Full Coverage', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tenantContext: TenantContextService;
  const apiUrl = environment.apiUrl;

  const mockAuthData: AuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: 'u1', email: 'test@test.com', role: 'ADMIN', name: 'Test' },
    tenant: { id: 't1', name: 'Test Clinic', activeModules: [] },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, TenantContextService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tenantContext = TestBed.inject(TenantContextService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('setTenantResolution should call tenantContext.setTenantContext', () => {
    const spy = vi.spyOn(tenantContext, 'setTenantContext');
    const resolution: TenantResolution = {
      tenant: { id: 't1', name: 'Clinic', code: 'clinic' },
      modules: [{ id: 'm1', code: 'PATIENT', name: 'Patient', status: 'ACTIVE' }],
      subscription: { status: 'ACTIVE', planName: 'Clinic', endDate: '2027-01-01' },
    };
    service.setTenantResolution(resolution);
    expect(spy).toHaveBeenCalledWith(resolution.tenant, resolution.modules, resolution.subscription);
    spy.mockRestore();
  });

  describe('verifyOtp — normalization', () => {
    it('should normalize verifyOtp response', () => {
      service.verifyOtp({ email: 'test@test.com', otp: '123456' }).subscribe((res) => {
        expect(res.data?.accessToken).toBe('access-token');
        expect(res.data?.user.email).toBe('test@test.com');
        expect(res.data?.tenant.name).toBe('Test Clinic');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-otp`);
      const rawResponse: ApiResponse<Record<string, unknown>> = {
        success: true,
        data: {
          token: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: 'u1', email: 'test@test.com', role: 'ADMIN' },
          tenant: { id: 't1', name: 'Test Clinic', activeModules: [] },
        },
        message: '', timestamp: '', requestId: '',
      };
      req.flush(rawResponse);
    });

    it('should handle verifyOtp failure gracefully', () => {
      service.verifyOtp({ email: 'test@test.com', otp: 'wrong' }).subscribe((res) => {
        expect(res.success).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-otp`);
      req.flush({ success: false, data: null, message: 'Invalid OTP', timestamp: '', requestId: '' });
    });

    it('should handle missing tenant data in verifyOtp', () => {
      service.verifyOtp({ email: 'test@test.com', otp: '123456' }).subscribe((res) => {
        expect(res.data?.tenant.id).toBe('');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-otp`);
      req.flush({ success: true, data: { token: 't', refreshToken: 'r', user: { id: '1', email: 'e', role: 'A' } }, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('login', () => {
    it('should POST login', () => {
      service.login('test@test.com', 'password').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com', password: 'password' });
      req.flush({ success: true, data: { requiresOtp: true, message: 'OTP sent' }, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('verifyPassword', () => {
    it('should POST verify-password', () => {
      service.verifyPassword('test@test.com', 'password').subscribe((res) => {
        expect(res.data?.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify-password`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { success: true, requiresOtp: false, message: '' }, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('register', () => {
    it('should POST register', () => {
      service.register({ email: 'new@test.com', tenantCode: 'test', role: 'DOCTOR' }).subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { message: 'Registered' }, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('logout', () => {
    it('should clear state and POST logout', () => {
      service['setSession'](mockAuthData);
      expect(service.isLoggedIn()).toBe(true);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.getToken()).toBeNull();
      expect(service.currentUser()).toBeNull();

      const req = httpMock.expectOne(`${apiUrl}/auth/logout`);
      expect(req.request.body).toEqual({ refreshToken: 'refresh-token' });
      req.flush({ success: true });
    });
  });

  describe('silentRefresh', () => {
    it('should restore tokens from localStorage and refresh', async () => {
      localStorage.setItem('cliniva_access_token', 'stored-access');
      localStorage.setItem('cliniva_refresh_token', 'stored-refresh');

      const promise = service.silentRefresh();

      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({
        success: true,
        data: {
          token: 'new-access',
          refreshToken: 'new-refresh',
          user: { id: 'u1', email: 'test@test.com', role: 'ADMIN' },
          tenant: { id: 't1', name: 'Test', activeModules: [] },
        },
        message: '', timestamp: '', requestId: '',
      });

      await promise;
      expect(service.isLoggedIn()).toBe(true);
      expect(service.getToken()).toBe('new-access');
    });

    it('should do nothing if no stored tokens', async () => {
      await service.silentRefresh();
      expect(service.isLoggedIn()).toBe(false);
    });

    it('should handle refresh failure gracefully', async () => {
      localStorage.setItem('cliniva_access_token', 'stored-access');
      localStorage.setItem('cliniva_refresh_token', 'stored-refresh');

      const promise = service.silentRefresh();

      const refreshReq = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      refreshReq.flush({ success: false }, { status: 401, statusText: 'Unauthorized' });

      await promise;
    });
  });

  describe('refreshToken', () => {
    it('should refresh and update session', () => {
      service['setSession'](mockAuthData);

      service.refreshToken().subscribe((token) => {
        expect(token).toBe('new-token');
        expect(service.getToken()).toBe('new-token');
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      req.flush({
        success: true,
        data: {
          token: 'new-token',
          refreshToken: 'new-refresh',
          user: { id: 'u1', email: 'test@test.com', role: 'ADMIN' },
          tenant: { id: 't1', name: 'Test', activeModules: [] },
        },
        message: '', timestamp: '', requestId: '',
      });
    });

    it('should handle refresh failure', () => {
      service['setSession'](mockAuthData);

      service.refreshToken().subscribe({
        error: (err) => {
          expect(err.message).toBe('Session expired');
          expect(service.isLoggedIn()).toBe(false);
          expect(service.getToken()).toBeNull();
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      req.flush({ success: false }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should throw on empty response (catches to Session expired)', () => {
      service['setSession'](mockAuthData);

      service.refreshToken().subscribe({
        error: (err) => {
          expect(err.message).toBe('Session expired');
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/refresh`);
      req.flush({ success: true, data: null, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('signals', () => {
    it('should expose loginStep signal', () => {
      expect(service.loginStep()).toBe('credentials');
      service.loginStep.set('otp');
      expect(service.loginStep()).toBe('otp');
    });

    it('should expose currentUser$ observable and currentUser signal', () => {
      service['setSession'](mockAuthData);
      expect(service.currentUser()?.email).toBe('test@test.com');
      service.currentUser$.subscribe((u) => {
        expect(u?.email).toBe('test@test.com');
      }).unsubscribe();
    });

    it('should return currentUserValue from subject', () => {
      service['setSession'](mockAuthData);
      expect(service.currentUserValue?.email).toBe('test@test.com');
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token', () => {
      service['setSession'](mockAuthData);
      expect(service.getRefreshToken()).toBe('refresh-token');
    });
  });
});
