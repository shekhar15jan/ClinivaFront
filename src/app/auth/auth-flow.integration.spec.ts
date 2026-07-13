import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../core/services/auth.service';
import { AuthGuard } from '../core/guards/auth.guard';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from '../core/interceptors/auth.interceptor';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';

describe('Auth Flow Integration', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'auth/login', loadChildren: () => import('./auth-module').then((m) => m.AuthModule) },
        ]),
      ],
      providers: [
        AuthService,
        AuthGuard,
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });

    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Full Login Flow (Email -> OTP -> Dashboard)', () => {
    it('Step 1: should send OTP when email is submitted', async () => {
      const resPromise = firstValueFrom(authService.sendOtp({ email: 'admin@cliniva.com' }));

      const req = httpMock.expectOne((r) => r.url.includes('/auth/send-otp'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@cliniva.com' });
      req.flush({ success: true, message: 'OTP sent' });

      const res = await resPromise;
      expect(res.success).toBe(true);
    });

    it('Step 2: should verify OTP and store JWT token', async () => {
      const request = { email: 'admin@cliniva.com', otp: '123456' };
      const mockResponse = {
        success: true,
        data: {
          token: 'mock.jwt.token',
          refreshToken: 'mock.refresh.token',
          user: {
            id: 'u1',
            email: 'admin@cliniva.com',
            role: 'ADMIN',
          },
        },
      };

      const resPromise = firstValueFrom(authService.verifyOtp(request));

      const req = httpMock.expectOne((r) => r.url.includes('/auth/verify-otp'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);

      await resPromise;
      expect(authService.isLoggedIn()).toBe(true);
      expect(authService.getToken()).toBe('mock.jwt.token');
    });

    it('Step 3: AuthGuard should allow access to dashboard after login', () => {
      const authData = {
        token: 'mock.jwt.token',
        refreshToken: 'mock.refresh.token',
        user: { id: 'u1', email: 'admin@cliniva.com', role: 'ADMIN' },
        tenant: { id: 't1', name: 'Cliniva', activeModules: [] },
      };
      authService['setSession'](authData);

      const guard = TestBed.inject(AuthGuard);
      const route = { params: {}, data: { roles: ['ADMIN'] } } as Partial<ActivatedRouteSnapshot>;
      const state = { url: '/dashboard' } as Partial<RouterStateSnapshot>;

      const canActivate = guard.canActivate(route as ActivatedRouteSnapshot, state as RouterStateSnapshot);
      expect(canActivate).toBe(true);
    });

    it('Step 4: AuthGuard should redirect to login when no token exists', () => {
      localStorage.clear();
      const guard = TestBed.inject(AuthGuard);
      const route = { params: {} } as Partial<ActivatedRouteSnapshot>;
      const state = { url: '/patients' } as Partial<RouterStateSnapshot>;

      const canActivate = guard.canActivate(route as ActivatedRouteSnapshot, state as RouterStateSnapshot);
      expect(canActivate).toBe(false);
    });
  });
});
